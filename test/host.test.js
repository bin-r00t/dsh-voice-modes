import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

function listen(server) {
  return new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
}

function close(server) {
  return new Promise((resolve) => server.close(resolve))
}

async function readRequest(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks)
}

test('Host routes select adapters and keep secrets out of responses', async (t) => {
  const home = await mkdtemp(path.join(os.tmpdir(), 'dsh-voice-modes-test-'))
  process.env.DSH_HOME = home

  const { apply } = await import('../index.js')
  let route
  apply({
    effect: (fn) => fn(),
    logger: { warn: (...args) => console.error('host warning', ...args) },
    webServer: {
      register(value) {
        route = value
        return () => {}
      },
    },
    connection: { requestRejection: () => undefined },
  })

  const calls = { mimo: [], transcription: [], llm: [] }
  const upstream = http.createServer(async (req, res) => {
    const body = await readRequest(req)
    if (req.url === '/v1/chat/completions') {
      const data = JSON.parse(body.toString('utf8'))
      if (JSON.stringify(data).includes('input_audio')) {
        calls.mimo.push({ headers: req.headers, data })
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ choices: [{ message: { content: 'MiMo 识别结果' } }] }))
        return
      }
      calls.llm.push({ headers: req.headers, data })
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ choices: [{ message: { content: '优化结果' } }] }))
      return
    }
    if (req.url === '/v1/audio/transcriptions') {
      calls.transcription.push({ headers: req.headers, bytes: body.length })
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ text: '通用识别结果' }))
      return
    }
    res.writeHead(404).end('not found')
  })

  await listen(upstream)
  const upstreamPort = upstream.address().port
  const server = http.createServer((req, res) => route.handler(req, res))
  await listen(server)
  const base = `http://127.0.0.1:${server.address().port}`

  t.after(async () => {
    await close(server)
    await close(upstream)
    await rm(home, { recursive: true, force: true })
  })

  async function call(pathname, init) {
    const response = await fetch(base + pathname, init)
    return { status: response.status, data: await response.json() }
  }

  async function saveSettings(patch) {
    return call('/voice-modes/settings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch),
    })
  }

  const audio = Buffer.from('fake wav audio').toString('base64')
  const mimoUrl = `http://127.0.0.1:${upstreamPort}/v1#mimo`
  const genericUrl = `http://127.0.0.1:${upstreamPort}/v1`

  await t.test('saves MiMo settings and returns a redacted provider catalogue', async () => {
    const saved = await saveSettings({
      asrUrl: mimoUrl,
      asrApiKey: 'mimo-secret',
      asrModel: 'whisper-1',
      roles: [{ id: 'test-role', name: '测试角色', prompt: '测试提示词' }],
    })
    assert.equal(saved.status, 200)
    assert.equal(saved.data.settings.asrProvider.id, 'xiaomi-mimo')
    assert.deepEqual(
      saved.data.settings.asrProviders.map((provider) => provider.id),
      ['xiaomi-mimo', 'openai-transcription'],
    )
    assert.equal(saved.data.settings.hasAsrApiKey, true)
    assert.equal(JSON.stringify(saved.data).includes('mimo-secret'), false)

    const loaded = await call('/voice-modes/settings')
    assert.equal(loaded.status, 200)
    assert.equal(loaded.data.settings.asrProvider.id, 'xiaomi-mimo')
    assert.equal(JSON.stringify(loaded.data).includes('mimo-secret'), false)
  })

  await t.test('sends WAV audio through the MiMo chat adapter', async () => {
    const result = await call('/voice-modes/process', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ audio, mime: 'audio/wav', mode: 'direct' }),
    })
    assert.equal(result.status, 200)
    assert.equal(result.data.text, 'MiMo 识别结果')
    assert.equal(result.data.provider.id, 'xiaomi-mimo')

    const request = calls.mimo.at(-1)
    assert.equal(request.headers['api-key'], 'mimo-secret')
    assert.equal(request.data.model, 'mimo-v2.5-asr')
    assert.equal(request.data.asr_options.language, 'auto')
    assert.match(
      request.data.messages[0].content[0].input_audio.data,
      /^data:audio\/wav;base64,/,
    )
  })

  await t.test('rejects an unsupported format for MiMo before fallback is configured', async () => {
    const result = await call('/voice-modes/process', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ audio, mime: 'audio/webm', mode: 'direct' }),
    })
    assert.equal(result.status, 415)
    assert.equal(result.data.error, 'unsupported-audio-format')
    assert.match(result.data.message, /Xiaomi MiMo ASR/)
  })

  await t.test('still uses the generic multipart adapter for other URLs', async () => {
    const saved = await saveSettings({ asrUrl: genericUrl, asrApiKey: 'generic-secret' })
    assert.equal(saved.status, 200)
    assert.equal(saved.data.settings.asrProvider.id, 'openai-transcription')

    const result = await call('/voice-modes/process', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ audio, mime: 'audio/wav', mode: 'direct' }),
    })
    assert.equal(result.status, 200)
    assert.equal(result.data.text, '通用识别结果')
    assert.equal(result.data.provider.id, 'openai-transcription')
    assert.match(calls.transcription.at(-1).headers['content-type'], /^multipart\/form-data/)
  })

  await t.test('uses the second provider for optimization', async () => {
    const saved = await saveSettings({
      secondaryUrl: genericUrl,
      secondaryApiKey: 'llm-secret',
      secondaryModel: 'test-llm',
    })
    assert.equal(saved.status, 200)
    assert.equal(saved.data.settings.hasSecondaryApiKey, true)
    assert.equal(JSON.stringify(saved.data).includes('llm-secret'), false)

    const result = await call('/voice-modes/process', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ audio, mime: 'audio/wav', mode: 'optimize' }),
    })
    assert.equal(result.status, 200)
    assert.equal(result.data.text, '优化结果')
    assert.equal(calls.llm.at(-1).data.model, 'test-llm')
    assert.match(calls.llm.at(-1).data.messages[0].content, /文本整理助手/)
  })
})

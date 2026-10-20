/**
 * Local mock provider for debugging the voice-mode plugin without a real
 * ASR/LLM account.
 *
 *   node voice-modes/debug/mock-provider.mjs
 *
 * Then open the voice settings and use:
 *   ASR endpoint:      http://127.0.0.1:8787/v1            (OpenAI multipart adapter)
 *   or ASR endpoint:   http://127.0.0.1:8787/v1#mimo       (MiMo chat/completions adapter)
 *   Second endpoint:   http://127.0.0.1:8787/v1
 *   Any API keys / model names.
 *
 * The `#mimo` fragment is a deliberate URL marker: it selects the MiMo adapter
 * but is not sent over HTTP, so the mock still receives /v1/chat/completions.
 *
 * Useful environment variables:
 *   PORT=8787                 listening port
 *   MOCK_ASR_STATUS=500       force an ASR HTTP status
 *   MOCK_LLM_STATUS=400       force an LLM HTTP status
 *   MOCK_DELAY_MS=1500        add latency to both endpoints
 *   MOCK_REPLY=...            text returned by the LLM endpoint
 */
import http from 'node:http'

const port = Number(process.env.PORT ?? 8787)
const asrStatus = Number(process.env.MOCK_ASR_STATUS ?? 200)
const llmStatus = Number(process.env.MOCK_LLM_STATUS ?? 200)
const delayMs = Number(process.env.MOCK_DELAY_MS ?? 0)
const mockReply = process.env.MOCK_REPLY ?? '这是 mock 优化后的文本。'

function log(message, detail) {
  const stamp = new Date().toISOString().slice(11, 19)
  console.log(`[${stamp}] ${message}`, detail === undefined ? '' : detail)
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function json(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
  })
  res.end(payload)
}

function summarizeMultipart(body) {
  const raw = body.toString('latin1')
  const fields = []
  for (const match of raw.matchAll(/name="([^"]+)"/g)) fields.push(match[1])
  return { bytes: body.length, fields: [...new Set(fields)] }
}

function summarizeLlm(body) {
  try {
    const data = JSON.parse(body.toString('utf8'))
    const parts = []
    for (const message of data.messages ?? []) {
      if (typeof message.content === 'string') parts.push({ role: message.role, content: message.content.slice(0, 80) })
      else if (Array.isArray(message.content)) {
        parts.push({
          role: message.role,
          content: message.content.map((part) => part.type ?? 'part'),
        })
      }
    }
    return { model: data.model, messageCount: data.messages?.length, parts }
  } catch {
    return { bytes: body.length, parse: 'failed' }
  }
}

const server = http.createServer(async (req, res) => {
  const started = Date.now()
  const body = await readBody(req)
  const auth = req.headers.authorization ? 'Bearer ***' : req.headers['api-key'] ? 'api-key ***' : 'none'
  log(`${req.method} ${req.url}`, { contentType: req.headers['content-type'], auth, bytes: body.length })

  if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs))

  if (req.method === 'GET' && req.url === '/health') {
    json(res, 200, { ok: true })
    return
  }

  if (req.method === 'POST' && req.url?.endsWith('/audio/transcriptions')) {
    log('ASR multipart', summarizeMultipart(body))
    if (asrStatus !== 200) {
      json(res, asrStatus, { error: { message: 'mock ASR failure' } })
      return
    }
    json(res, 200, { text: '这是来自 mock ASR 的测试文本。' })
    log('ASR done', `${Date.now() - started}ms`)
    return
  }

  if (req.method === 'POST' && req.url?.endsWith('/chat/completions')) {
    const summary = summarizeLlm(body)
    const hasAudio = JSON.stringify(summary).includes('input_audio')
    if (hasAudio) {
      log('ASR chat/completions (MiMo-style)', summary)
      if (asrStatus !== 200) {
        json(res, asrStatus, { error: { message: 'mock ASR failure' } })
        return
      }
      json(res, 200, {
        choices: [{ message: { role: 'assistant', content: '这是 mock ASR 通过 chat/completions 返回的文本。' } }],
      })
      log('ASR chat done', `${Date.now() - started}ms`)
      return
    }
    log('LLM request', summary)
    if (llmStatus !== 200) {
      json(res, llmStatus, { error: { message: 'mock LLM failure' } })
      return
    }
    json(res, 200, {
      choices: [{ message: { role: 'assistant', content: mockReply } }],
    })
    log('LLM done', `${Date.now() - started}ms`)
    return
  }

  json(res, 404, { error: 'not-found' })
})

server.listen(port, '127.0.0.1', () => {
  log(`mock provider listening on http://127.0.0.1:${port}`)
  log(`set ASR and second-provider endpoints to http://127.0.0.1:${port}/v1`)
})

/**
 * Host half of the voice-mode composer plugin.
 *
 * Owns the ASR/LLM credentials on the Host, persists voice settings under
 * `$DSH_HOME/voice-modes/`, and exposes a same-origin proxy so the browser
 * never has to call an upstream provider directly (or see its API key).
 */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'

import { describeAsrProvider, listAsrProviders, resolveAsrProvider } from './providers.js'

export const inject = ['webServer', 'connection']

const ROUTE_PREFIX = '/voice-modes'
const MAX_BODY_BYTES = 32 * 1024 * 1024
const MAX_AUDIO_BYTES = 24 * 1024 * 1024
const ASR_TIMEOUT_MS = 90_000
const LLM_TIMEOUT_MS = 90_000

const DEFAULTS = {
  asrUrl: '',
  asrApiKey: '',
  asrModel: 'whisper-1',
  secondaryUrl: '',
  secondaryApiKey: '',
  secondaryModel: 'gpt-4o-mini',
  targetLanguage: 'en',
  roles: [
    {
      id: 'meeting-notes',
      name: '会议纪要',
      prompt:
        '你是一名专业的会议秘书。把口述内容整理成结构清晰的会议纪要，区分议题、结论和待办事项；只保留明确出现的信息，不要编造。',
    },
    {
      id: 'tech-writing',
      name: '技术说明',
      prompt:
        '你是一名资深软件工程师。把口述内容整理为准确、简洁的技术说明，使用恰当的术语和清晰的分段，不要添加未提及的事实。',
    },
    {
      id: 'business-email',
      name: '商务邮件',
      prompt:
        '你是一名商务沟通专家。把口述内容整理成一封礼貌、清晰、简洁的商务邮件，保留原意和语气，不要添加承诺或事实。',
    },
    {
      id: 'product-request',
      name: '产品需求',
      prompt:
        '你是一名产品经理。把口述内容整理成产品需求描述，按背景、目标、需求细节和验收标准组织；不清楚的地方明确标为待确认，不要编造。',
    },
  ],
}

const MODES = new Set(['direct', 'optimize', 'translate', 'role'])

const AUDIO_TYPES = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mp4': 'mp4',
  'audio/m4a': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/wav': 'wav',
  'audio/wave': 'wav',
  'audio/x-wav': 'wav',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
}

class HttpError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  })
  res.end(body)
}

async function readJson(req) {
  const chunks = []
  let total = 0
  for await (const chunk of req) {
    total += chunk.length
    if (total > MAX_BODY_BYTES) {
      throw new HttpError(413, 'audio-too-large', 'request body is too large')
    }
    chunks.push(chunk)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw.trim()) return {}
  try {
    return JSON.parse(raw)
  } catch {
    throw new HttpError(400, 'bad-request', 'request body must be JSON')
  }
}

function digits(value, fallback) {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  return trimmed || fallback
}

function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeRoles(value, fallback) {
  if (!Array.isArray(value)) return fallback
  const seen = new Set()
  const roles = []
  for (const entry of value.slice(0, 50)) {
    if (entry === null || typeof entry !== 'object') continue
    const name = text(entry.name).slice(0, 80)
    const prompt = text(entry.prompt).slice(0, 8000)
    if (!name || !prompt) continue
    let id = text(entry.id).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64)
    if (!id || seen.has(id)) {
      id = `role-${roles.length + 1}-${Math.random().toString(36).slice(2, 9)}`
    }
    seen.add(id)
    roles.push({ id, name, prompt })
  }
  return roles
}

function normalizeSettings(value) {
  const source = value !== null && typeof value === 'object' ? value : {}
  return {
    asrUrl: text(source.asrUrl),
    asrApiKey: text(source.asrApiKey),
    asrModel: digits(source.asrModel, DEFAULTS.asrModel),
    secondaryUrl: text(source.secondaryUrl),
    secondaryApiKey: text(source.secondaryApiKey),
    secondaryModel: digits(source.secondaryModel, DEFAULTS.secondaryModel),
    targetLanguage: 'en',
    roles: normalizeRoles(source.roles, DEFAULTS.roles.map((role) => ({ ...role }))),
  }
}

function publicSettings(settings) {
  return {
    asrUrl: settings.asrUrl,
    asrModel: settings.asrModel,
    hasAsrApiKey: Boolean(settings.asrApiKey),
    secondaryUrl: settings.secondaryUrl,
    secondaryModel: settings.secondaryModel,
    hasSecondaryApiKey: Boolean(settings.secondaryApiKey),
    targetLanguage: settings.targetLanguage,
    roles: settings.roles,
    asrProvider: describeAsrProvider(settings.asrUrl),
    asrProviders: listAsrProviders(),
  }
}

function mergeSettings(current, patch) {
  const next = { ...current }
  const stringFields = ['asrUrl', 'asrModel', 'secondaryUrl', 'secondaryModel']
  for (const field of stringFields) {
    if (typeof patch[field] === 'string') next[field] = patch[field].trim()
  }
  // An omitted or empty secret means "keep the stored secret"; null clears it.
  for (const field of ['asrApiKey', 'secondaryApiKey']) {
    if (patch[field] === null) next[field] = ''
    else if (typeof patch[field] === 'string' && patch[field].trim()) next[field] = patch[field].trim()
  }
  if (!next.secondaryUrl) next.secondaryApiKey = ''
  if (Array.isArray(patch.roles)) next.roles = normalizeRoles(patch.roles, current.roles)
  next.targetLanguage = 'en'
  return normalizeSettings(next)
}

function assertHttpUrl(value, code, label) {
  let url
  try {
    url = new URL(value)
  } catch {
    throw new HttpError(400, code, `${label} must be a valid URL`)
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new HttpError(400, code, `${label} must use http or https`)
  }
}

function validateSettings(settings) {
  if (!settings.asrUrl) {
    throw new HttpError(400, 'missing-asr-url', 'ASR provider URL is required')
  }
  assertHttpUrl(settings.asrUrl, 'invalid-asr-url', 'ASR provider URL')
  if (!settings.asrApiKey) {
    throw new HttpError(400, 'missing-asr-key', 'ASR API key is required')
  }
  if (settings.secondaryUrl) {
    assertHttpUrl(settings.secondaryUrl, 'invalid-secondary-url', 'second provider URL')
    if (!settings.secondaryApiKey) {
      throw new HttpError(400, 'missing-secondary-key', 'second provider API key is required')
    }
  } else if (settings.secondaryApiKey) {
    throw new HttpError(400, 'missing-secondary-url', 'second provider URL is required')
  }
  if (!settings.roles.length) {
    throw new HttpError(400, 'no-roles', 'at least one role is required')
  }
}

function endpoint(base, suffix) {
  const url = new URL(base)
  const pathname = url.pathname.replace(/\/+$/, '')
  if (!pathname) {
    url.pathname = `/v1${suffix}`
  } else if (pathname.endsWith('/v1')) {
    url.pathname = `${pathname}${suffix}`
  } else {
    url.pathname = pathname
  }
  return url
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new HttpError(504, 'upstream-timeout', 'the upstream provider timed out')
    }
    throw new HttpError(502, 'upstream-network', `cannot reach the upstream provider: ${error?.message ?? error}`)
  } finally {
    clearTimeout(timer)
  }
}

async function responseError(response) {
  let detail = ''
  try {
    detail = (await response.text()).replace(/\s+/g, ' ').slice(0, 500)
  } catch {
    // The status alone is still useful.
  }
  return `${response.status} ${response.statusText}${detail ? `: ${detail}` : ''}`.trim()
}

async function transcribeOnce(providerUrl, apiKey, model, audio, mime, filename) {
  const provider = resolveAsrProvider(providerUrl)
  if (!provider.acceptsMime(mime)) {
    throw new HttpError(
      415,
      'unsupported-audio-format',
      `${provider.label} does not accept ${mime || 'this audio format'}`,
    )
  }
  if (provider.maxAudioBytes && audio.length > provider.maxAudioBytes) {
    throw new HttpError(
      413,
      'audio-too-large',
      `${provider.label} accepts at most ${(provider.maxAudioBytes / 1024 / 1024).toFixed(1)} MB of audio`,
    )
  }

  let request
  try {
    request = provider.buildRequest({
      url: providerUrl,
      apiKey,
      model,
      audio,
      mime,
      filename,
    })
  } catch (error) {
    throw new HttpError(400, 'asr-request', `${provider.label}: ${error?.message ?? error}`)
  }

  const response = await fetchWithTimeout(
    request.endpoint,
    {
      method: 'POST',
      headers: request.headers,
      body: request.body,
    },
    ASR_TIMEOUT_MS,
  )

  if (!response.ok) {
    throw new HttpError(502, 'asr-failed', `${provider.label}: ${await responseError(response)}`)
  }

  const contentType = response.headers.get('content-type') ?? ''
  const raw = await response.text()
  let data
  if (contentType.includes('json') || raw.trim().startsWith('{')) {
    try {
      data = JSON.parse(raw)
    } catch {
      throw new HttpError(502, 'asr-failed', `${provider.label} returned malformed JSON`)
    }
  }

  const transcript = text(provider.extractText(data, raw)).trim()
  if (!transcript) {
    throw new HttpError(502, 'asr-empty', `${provider.label} returned an empty transcript`)
  }
  return { transcript, provider }
}

async function transcribe(settings, audio, mime, filename) {
  try {
    return await transcribeOnce(
      settings.asrUrl,
      settings.asrApiKey,
      settings.asrModel,
      audio,
      mime,
      filename,
    )
  } catch (primaryError) {
    if (!settings.secondaryUrl || !settings.secondaryApiKey) throw primaryError
    try {
      return {
        ...(await transcribeOnce(
          settings.secondaryUrl,
          settings.secondaryApiKey,
          settings.asrModel,
          audio,
          mime,
          filename,
        )),
        fallback: true,
      }
    } catch (secondaryError) {
      throw new HttpError(
        502,
        'asr-failed',
        `primary provider: ${primaryError.message}; second provider: ${secondaryError.message}`,
      )
    }
  }
}

function buildMessages(mode, transcript, role) {
  if (mode === 'optimize') {
    return [
      {
        role: 'system',
        content:
          '你是语音输入的文本整理助手。删除口语中的语气词、填充词、重复和停顿标记（例如“嗯、啊、那个、就是说、然后呢”、um、uh、like、you know），修正明显的同音错字和标点，但必须完整保留用户原意、信息与语言。不要总结、扩写、回答问题或添加内容。只输出整理后的文本，不要解释，不要引号。',
      },
      { role: 'user', content: transcript },
    ]
  }
  if (mode === 'translate') {
    return [
      {
        role: 'system',
        content:
          '你是语音输入的翻译助手。输入是一段口语转写。先删除语气词、填充词、重复和停顿标记，修正明显的识别错误，然后把内容翻译成自然、准确的英语。保留原意、语气和关键信息，不总结、不添加内容。只输出最终的英文文本，不要解释，不要引号。',
      },
      { role: 'user', content: transcript },
    ]
  }
  if (mode === 'role') {
    return [
      {
        role: 'system',
        content: `你是语音输入整理助手，执行下面这个角色的要求：\n\n${role.prompt}\n\n同时删除口语中的语气词、填充词、重复和停顿标记，修正明显的识别错误，保持用户原意。只输出最终要插入输入框的文本，不要解释，不要添加“好的”等对话式回应，不要使用引号或代码块。`,
      },
      { role: 'user', content: transcript },
    ]
  }
  throw new HttpError(400, 'bad-mode', 'unknown voice mode')
}

function cleanLlmText(value) {
  let output = text(value)
  output = output.replace(/^```[^\n]*\n?/i, '').replace(/\n?```\s*$/i, '')
  output = output.replace(
    /^(?:整理后|优化后|翻译后|最终结果|结果|输出|Output|Result|Translated text)\s*[:：]\s*/i,
    '',
  )
  if (
    output.length >= 2 &&
    ((output.startsWith('"') && output.endsWith('"')) ||
      (output.startsWith('“') && output.endsWith('”')) ||
      (output.startsWith('「') && output.endsWith('」')))
  ) {
    output = output.slice(1, -1).trim()
  }
  return output.trim()
}

async function complete(settings, mode, transcript, role) {
  const response = await fetchWithTimeout(
    endpoint(settings.secondaryUrl, '/chat/completions'),
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${settings.secondaryApiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: settings.secondaryModel,
        messages: buildMessages(mode, transcript, role),
        temperature: 0.2,
        max_tokens: 2000,
        stream: false,
      }),
    },
    LLM_TIMEOUT_MS,
  )

  if (!response.ok) {
    throw new HttpError(502, 'llm-failed', await responseError(response))
  }

  let data
  try {
    data = await response.json()
  } catch {
    throw new HttpError(502, 'llm-failed', 'second provider returned malformed JSON')
  }

  let content = data?.choices?.[0]?.message?.content
  if (Array.isArray(content)) {
    content = content
      .map((part) => (typeof part === 'string' ? part : text(part?.text)))
      .filter(Boolean)
      .join('')
  }
  if (!content) content = data?.choices?.[0]?.text
  const output = cleanLlmText(content)
  if (!output) {
    throw new HttpError(502, 'llm-empty', 'second provider returned empty text')
  }
  return output
}

function settingsPath() {
  const home = process.env.DSH_HOME || path.join(homedir(), '.dsh')
  return path.join(home, 'voice-modes', 'settings.json')
}

async function loadSettings(ctx) {
  const file = settingsPath()
  try {
    const raw = await readFile(file, 'utf8')
    return normalizeSettings(JSON.parse(raw))
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      ctx.logger?.warn?.(`voice-modes: cannot read ${file}: ${error?.message ?? error}`)
    }
    return normalizeSettings(DEFAULTS)
  }
}

async function saveSettings(settings) {
  const file = settingsPath()
  await mkdir(path.dirname(file), { recursive: true, mode: 0o700 })
  const temporary = `${file}.${process.pid}.tmp`
  const body = `${JSON.stringify(settings, null, 2)}\n`
  await writeFile(temporary, body, { mode: 0o600 })
  try {
    await rename(temporary, file)
  } catch {
    await writeFile(file, body, { mode: 0o600 })
  }
}

export function apply(ctx) {
  let state
  let ready
  const load = () => {
    if (!ready) {
      ready = loadSettings(ctx).then((settings) => {
        state = settings
        return settings
      })
    }
    return ready
  }

  const route = {
    kind: 'prefix',
    path: ROUTE_PREFIX,
    handler: async (req, res) => {
      try {
        const rejection = ctx.connection.requestRejection(req)
        if (rejection !== undefined) {
          res.statusCode = rejection
          res.end()
          return
        }

        const url = new URL(req.url ?? '/', 'http://localhost')
        if (url.pathname === `${ROUTE_PREFIX}/settings` && req.method === 'GET') {
          const settings = state ?? (await load())
          sendJson(res, 200, { settings: publicSettings(settings) })
          return
        }

        if (url.pathname === `${ROUTE_PREFIX}/settings` && req.method === 'POST') {
          const patch = await readJson(req)
          const current = state ?? (await load())
          const next = mergeSettings(current, patch)
          validateSettings(next)
          await saveSettings(next)
          state = next
          sendJson(res, 200, { settings: publicSettings(next) })
          return
        }

        if (url.pathname === `${ROUTE_PREFIX}/process` && req.method === 'POST') {
          const settings = state ?? (await load())
          const body = await readJson(req)
          const mode = text(body.mode) || 'direct'
          if (!MODES.has(mode)) throw new HttpError(400, 'bad-mode', 'unknown voice mode')
          if (!settings.asrUrl || !settings.asrApiKey) {
            throw new HttpError(400, 'not-configured', 'configure the ASR provider first')
          }

          const audio = Buffer.from(typeof body.audio === 'string' ? body.audio : '', 'base64')
          if (!audio.length) throw new HttpError(400, 'empty-audio', 'audio recording is empty')
          if (audio.length > MAX_AUDIO_BYTES) {
            throw new HttpError(413, 'audio-too-large', 'audio recording is too large')
          }

          const mime = typeof body.mime === 'string' ? body.mime.split(';', 1)[0].trim().toLowerCase() : ''
          const safeMime = AUDIO_TYPES[mime] ? mime : 'audio/webm'
          const filename = `recording.${AUDIO_TYPES[safeMime] ?? 'webm'}`

          const result = await transcribe(settings, audio, safeMime, filename)
          let output = result.transcript
          let role = null
          if (mode !== 'direct') {
            if (!settings.secondaryUrl || !settings.secondaryApiKey) {
              throw new HttpError(
                400,
                'text-not-configured',
                'this mode needs the second provider URL and API key',
              )
            }
            if (mode === 'role') {
              const roleId = text(body.roleId)
              role = settings.roles.find((entry) => entry.id === roleId)
              if (!role) throw new HttpError(400, 'unknown-role', 'the selected role no longer exists')
            }
            output = await complete(settings, mode, result.transcript, role)
          }

          sendJson(res, 200, {
            text: output,
            transcript: result.transcript,
            mode,
            fallback: Boolean(result.fallback),
            provider: result.provider
              ? { id: result.provider.id, label: result.provider.label }
              : null,
          })
          return
        }

        sendJson(res, 404, { error: 'not-found', message: 'unknown voice-mode route' })
      } catch (error) {
        if (error instanceof HttpError) {
          sendJson(res, error.status, { error: error.code, message: error.message })
        } else {
          ctx.logger?.warn?.(`voice-modes: request failed: ${error?.stack ?? error}`)
          sendJson(res, 500, { error: 'internal', message: 'unexpected voice-mode failure' })
        }
      }
    },
  }

  ctx.effect(() => ctx.webServer.register(route), 'voice-modes: ASR and settings routes')
  load().catch((error) => {
    ctx.logger?.warn?.(`voice-modes: initial settings load failed: ${error?.message ?? error}`)
  })
}

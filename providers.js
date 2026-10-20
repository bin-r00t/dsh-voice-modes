/**
 * Built-in ASR provider catalogue.
 *
 * Each adapter owns everything that differs between providers:
 * URL detection, endpoint derivation, authentication headers, request body,
 * model fallback, accepted audio formats, size limits, and response parsing.
 *
 * To add a provider:
 *   1. Append an adapter object before the OpenAI-compatible fallback.
 *   2. Give it a stable `id`, a human-readable `label`, and a strict `match`.
 *   3. Implement `buildRequest` returning `{ endpoint, headers, body }`.
 *   4. Implement `extractText(data, rawText)`.
 *
 * `match` receives the raw configured URL, including its fragment, so a proxy
 * URL can opt in explicitly with a marker such as `https://proxy/asr#mimo`.
 */

/** MiMo accepts at most 10 MB of Base64 audio; leave room for expansion and the data-URL prefix. */
const MIMO_MAX_RAW_AUDIO_BYTES = 7_800_000

function baseMime(mime) {
  return typeof mime === 'string' ? mime.split(';', 1)[0].trim().toLowerCase() : ''
}

function apEndpoint(base, suffix) {
  const url = new URL(base)
  const pathname = url.pathname.replace(/\/+$/, '')
  if (!pathname) url.pathname = `/v1${suffix}`
  else if (pathname.endsWith('/v1')) url.pathname = `${pathname}${suffix}`
  else url.pathname = pathname
  url.hash = ''
  return url.href
}

function mimoAudioMime(mime) {
  const value = baseMime(mime)
  if (value === 'audio/wav' || value === 'audio/wave' || value === 'audio/x-wav') return 'audio/wav'
  if (value === 'audio/mpeg' || value === 'audio/mp3') return 'audio/mpeg'
  return null
}

function extractChatText(data) {
  const content = data?.choices?.[0]?.message?.content
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === 'string' ? part : typeof part?.text === 'string' ? part.text : ''))
      .join('')
  }
  return typeof content === 'string' ? content : ''
}

/** Xiaomi MiMo-V2.5-ASR, OpenAI Chat Completions compatible audio input. */
const xiaomiMimo = {
  id: 'xiaomi-mimo',
  label: 'Xiaomi MiMo ASR',
  defaultModel: 'mimo-v2.5-asr',
  maxAudioBytes: MIMO_MAX_RAW_AUDIO_BYTES,
  acceptsMime(mime) {
    return mimoAudioMime(mime) !== null
  },
  match(url) {
    return typeof url === 'string' && /mimo/i.test(url)
  },
  resolveModel(model) {
    const value = typeof model === 'string' ? model.trim() : ''
    // The settings default is whisper-1; switching the URL to MiMo should not
    // leave a model that MiMo cannot serve.
    if (!value || value === 'whisper-1') return this.defaultModel
    return value
  },
  buildRequest({ url, apiKey, model, audio, mime }) {
    const audioMime = mimoAudioMime(mime)
    if (audioMime === null) throw new Error('Xiaomi MiMo ASR accepts only WAV or MP3 audio')
    const dataUrl = `data:${audioMime};base64,${audio.toString('base64')}`
    return {
      endpoint: apEndpoint(url, '/chat/completions'),
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: this.resolveModel(model),
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'input_audio',
                input_audio: { data: dataUrl },
              },
            ],
          },
        ],
        asr_options: { language: 'auto' },
        stream: false,
      }),
    }
  },
  extractText(data) {
    return extractChatText(data)
  },
}

/** Standard OpenAI-compatible multipart transcription endpoint. */
const openaiTranscription = {
  id: 'openai-transcription',
  label: 'OpenAI-compatible transcription',
  defaultModel: 'whisper-1',
  maxAudioBytes: null,
  acceptsMime() {
    return true
  },
  match() {
    return true
  },
  resolveModel(model) {
    const value = typeof model === 'string' ? model.trim() : ''
    return value || this.defaultModel
  },
  buildRequest({ url, apiKey, model, audio, mime, filename }) {
    const form = new FormData()
    form.append('file', new Blob([audio], { type: baseMime(mime) || 'audio/webm' }), filename)
    form.append('model', this.resolveModel(model))
    form.append('response_format', 'json')
    return {
      endpoint: apEndpoint(url, '/audio/transcriptions'),
      headers: { authorization: `Bearer ${apiKey}` },
      body: form,
    }
  },
  extractText(data, rawText) {
    if (data && typeof data === 'object') {
      const text =
        data.text ||
        data.result ||
        data.transcript ||
        data.data?.text ||
        data.segments?.map?.((segment) => segment.text).join?.(' ')
      return typeof text === 'string' ? text : ''
    }
    return typeof rawText === 'string' ? rawText : ''
  },
}

/**
 * Ordered catalogue. The last entry must remain the generic fallback.
 * More specific providers must be inserted above it.
 */
export const BUILTIN_ASR_PROVIDERS = [xiaomiMimo, openaiTranscription]

/** Resolve the adapter for a configured ASR URL. */
export function resolveAsrProvider(url) {
  const source = typeof url === 'string' ? url : ''
  return BUILTIN_ASR_PROVIDERS.find((provider) => provider.match(source)) ?? openaiTranscription
}

/** Browser-safe description of the adapter selected by a URL. */
export function describeAsrProvider(url) {
  if (!url) return null
  const provider = resolveAsrProvider(url)
  return {
    id: provider.id,
    label: provider.label,
    defaultModel: provider.defaultModel,
    maxAudioBytes: provider.maxAudioBytes ?? null,
  }
}

/** Browser-safe catalogue listing for settings UIs and diagnostics. */
export function listAsrProviders() {
  return BUILTIN_ASR_PROVIDERS.map((provider) => ({
    id: provider.id,
    label: provider.label,
    defaultModel: provider.defaultModel,
    maxAudioBytes: provider.maxAudioBytes ?? null,
  }))
}

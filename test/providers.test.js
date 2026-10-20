import test from 'node:test'
import assert from 'node:assert/strict'

import {
  BUILTIN_ASR_PROVIDERS,
  describeAsrProvider,
  listAsrProviders,
  resolveAsrProvider,
} from '../providers.js'

const wav = Buffer.from('fake wav bytes')

test('catalog order keeps the generic adapter last', () => {
  assert.ok(BUILTIN_ASR_PROVIDERS.length >= 2)
  assert.equal(BUILTIN_ASR_PROVIDERS.at(-1).id, 'openai-transcription')
  assert.deepEqual(
    listAsrProviders().map((provider) => provider.id),
    ['xiaomi-mimo', 'openai-transcription'],
  )
})

test('resolves MiMo from the provider URL', () => {
  assert.equal(resolveAsrProvider('https://api.xiaomimimo.com/v1/chat/completions').id, 'xiaomi-mimo')
  assert.equal(resolveAsrProvider('https://mimo.example.test/v1').id, 'xiaomi-mimo')
  assert.equal(resolveAsrProvider('https://proxy.example/asr#mimo').id, 'xiaomi-mimo')
  assert.equal(resolveAsrProvider('https://api.openai.com/v1').id, 'openai-transcription')
  assert.equal(resolveAsrProvider('').id, 'openai-transcription')
})

test('describes the detected adapter without exposing internals', () => {
  assert.deepEqual(describeAsrProvider('https://api.xiaomimimo.com/v1'), {
    id: 'xiaomi-mimo',
    label: 'Xiaomi MiMo ASR',
    defaultModel: 'mimo-v2.5-asr',
    maxAudioBytes: 7_800_000,
  })
  assert.equal(describeAsrProvider(''), null)
})

test('builds the MiMo chat-completions audio request', () => {
  const provider = resolveAsrProvider('https://api.xiaomimimo.com/v1/chat/completions')
  const request = provider.buildRequest({
    url: 'https://api.xiaomimimo.com/v1/chat/completions',
    apiKey: 'secret',
    model: 'whisper-1',
    audio: wav,
    mime: 'audio/wav',
    filename: 'recording.wav',
  })

  assert.equal(request.endpoint, 'https://api.xiaomimimo.com/v1/chat/completions')
  assert.equal(request.headers['api-key'], 'secret')
  assert.equal(request.headers['content-type'], 'application/json')

  const body = JSON.parse(request.body)
  assert.equal(body.model, 'mimo-v2.5-asr')
  assert.deepEqual(body.asr_options, { language: 'auto' })
  assert.equal(body.stream, false)
  assert.equal(body.messages[0].role, 'user')
  assert.equal(body.messages[0].content[0].type, 'input_audio')
  assert.match(
    body.messages[0].content[0].input_audio.data,
    /^data:audio\/wav;base64,ZmFrZSB3YXYgYnl0ZXM=/,
  )
})

test('MiMo accepts only WAV and MP3', () => {
  const provider = resolveAsrProvider('https://api.xiaomimimo.com/v1')
  assert.equal(provider.acceptsMime('audio/wav'), true)
  assert.equal(provider.acceptsMime('audio/x-wav'), true)
  assert.equal(provider.acceptsMime('audio/mp3'), true)
  assert.equal(provider.acceptsMime('audio/mpeg'), true)
  assert.equal(provider.acceptsMime('audio/webm;codecs=opus'), false)
  assert.equal(provider.acceptsMime('audio/ogg'), false)
})

test('extracts MiMo chat response text', () => {
  const provider = resolveAsrProvider('https://api.xiaomimimo.com/v1')
  assert.equal(
    provider.extractText({ choices: [{ message: { content: 'hello' } }] }),
    'hello',
  )
  assert.equal(
    provider.extractText({
      choices: [{ message: { content: [{ type: 'text', text: 'a' }, 'b'] } }],
    }),
    'ab',
  )
  assert.equal(provider.extractText({}), '')
})

test('builds the OpenAI-compatible multipart request', () => {
  const provider = resolveAsrProvider('https://api.openai.com/v1')
  const request = provider.buildRequest({
    url: 'https://api.openai.com/v1',
    apiKey: 'secret',
    model: '',
    audio: wav,
    mime: 'audio/wav',
    filename: 'recording.wav',
  })

  assert.equal(request.endpoint, 'https://api.openai.com/v1/audio/transcriptions')
  assert.equal(request.headers.authorization, 'Bearer secret')
  assert.ok(request.body instanceof FormData)
  assert.equal(request.body.get('model'), 'whisper-1')
  assert.equal(request.body.get('response_format'), 'json')
  assert.equal(request.body.get('file').type, 'audio/wav')
})

test('extracts OpenAI-compatible response text and accepts raw text', () => {
  const provider = resolveAsrProvider('https://api.openai.com/v1')
  assert.equal(provider.extractText({ text: 'hello' }), 'hello')
  assert.equal(provider.extractText({ result: 'result' }), 'result')
  assert.equal(provider.extractText({ data: { text: 'nested' } }), 'nested')
  assert.equal(provider.extractText(undefined, 'raw text'), 'raw text')
})

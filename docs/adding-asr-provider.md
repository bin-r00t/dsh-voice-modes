# Adding an ASR provider

ASR providers differ in endpoint, authentication, request shape, audio format, size limit and response shape. `providers.js` is the single place that owns those differences.

## Adapter contract

Add an object to `BUILTIN_ASR_PROVIDERS` in `providers.js`, **before** the OpenAI-compatible fallback.

```js
const exampleProvider = {
  id: 'example-asr',
  label: 'Example ASR',
  defaultModel: 'example-asr-v1',

  // Receives the raw configured URL, including any #fragment.
  match(url) {
    return /example-asr\.com/i.test(url)
  },

  // Optional: choose a default or normalize the configured model.
  resolveModel(model) {
    const value = typeof model === 'string' ? model.trim() : ''
    return value || this.defaultModel
  },

  // Optional: reject unsupported MIME types before a request is made.
  acceptsMime(mime) {
    return mime === 'audio/wav'
  },

  // Optional: enforced by the Host before buildRequest().
  maxAudioBytes: 10 * 1024 * 1024,

  // Return { endpoint, headers, body }.
  buildRequest({ url, apiKey, model, audio, mime, filename }) {
    return {
      endpoint: 'https://api.example-asr.com/v1/transcribe',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: this.resolveModel(model),
        audio: audio.toString('base64'),
        format: 'wav',
      }),
    }
  },

  // Required: turn the provider response into a transcript string.
  extractText(data, rawText) {
    return typeof data?.text === 'string' ? data.text : rawText
  },
}

export const BUILTIN_ASR_PROVIDERS = [
  // Specific providers first.
  xiaomiMimo,
  exampleProvider,
  // Generic fallback must stay last.
  openaiTranscription,
]
```

## Contract details

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | Yes | Stable machine-readable id. Use kebab-case. |
| `label` | Yes | Human-readable label shown in settings. |
| `match(url)` | Yes | Pure function; no network requests. Return `true` when this adapter owns the URL. |
| `buildRequest(input)` | Yes | Return `{ endpoint, headers, body }`. `body` may be a string or `FormData`. |
| `extractText(data, rawText)` | Yes | Return the transcript. `data` is parsed JSON when available; otherwise `undefined`. |
| `defaultModel` | Recommended | Used by `resolveModel` when the configured model is empty. |
| `resolveModel(model)` | Optional | Normalize or fall back to a provider-specific model. |
| `acceptsMime(mime)` | Optional | Default: accept everything. |
| `maxAudioBytes` | Optional | Host-enforced raw audio limit. Account for Base64 expansion if the provider limits encoded size. |

## URL detection

- `match` receives the URL exactly as configured, including a fragment.
- Fragments are not sent over HTTP. They are useful as explicit adapter markers for proxy URLs: `https://proxy.example/asr#mimo`.
- The Host strips the fragment from the final endpoint in `apEndpoint`.
- Detection must be deterministic and must not perform I/O.
- The fallback adapter's `match` returns `true`; keep it last.

## Audio constraints

The Client sends 16 kHz mono WAV whenever browser conversion succeeds. If your provider requires another format:

- Prefer a format the Client already produces.
- If conversion is required, document it and discuss the change before implementing it; do not silently send a format the provider rejects.
- Set `acceptsMime` and `maxAudioBytes` so failures happen before the network call with a clear `415` or `413`.

## Response parsing

`extractText` should:

- tolerate optional fields;
- return an empty string rather than throwing;
- handle provider-specific wrappers;
- never include error pages or HTML as a successful transcript.

The Host trims the result and returns `asr-empty` when it is blank.

## Tests

Add tests in `test/providers.test.js`:

- URL detection, including near-miss URLs;
- endpoint derivation for base and full URLs;
- headers and body shape;
- model fallback;
- accepted and rejected MIME types;
- `maxAudioBytes`;
- response extraction for real response shapes.

If the provider introduces a new route or request type, add a mock-provider case and a Host test in `test/host.test.js`.

Run:

```bash
npm run check
npm test
```

## Documentation checklist

- Update the provider table in `README.md` and `README.zh.md`.
- Add an entry to `CHANGELOG.md`.
- Link the official provider documentation.
- Document required scopes, audio formats and size limits.
- Note any privacy or regional restrictions.

## Security checklist

- Do not log API keys, Authorization headers or audio bytes.
- Do not make network requests during detection.
- Do not persist provider responses.
- Treat response data as untrusted text.
- Keep the adapter dependency-free unless there is a strong reason.
- Do not bypass the Host proxy or expose keys to the Client.

## Pull request

Use the repository PR template and complete the provider checklist. A maintainer may ask for a sample response and a mock-based test before merging.

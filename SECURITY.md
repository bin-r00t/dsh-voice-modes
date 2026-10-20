# Security policy

## Supported versions

The latest `0.x` release receives security fixes. The project is pre-1.0 and extension points may change between minor releases.

## Reporting a vulnerability

Please **do not open a public issue** for a vulnerability.

Use GitHub's private vulnerability reporting:

https://github.com/bin-r00t/dsh-voice-modes/security/advisories/new

Include:

- affected version and DSH version;
- operating system and browser;
- steps to reproduce;
- impact assessment;
- any relevant logs with secrets and audio removed.

Do not include real API keys, private audio or personal data. We will acknowledge the report and coordinate disclosure.

## Security model

### Credentials

- ASR and second-provider API keys are stored by the Host in `~/.dsh/voice-modes/settings.json` with mode `0600`.
- The settings API returns only booleans such as `hasAsrApiKey`; it never returns stored keys.
- API keys are not placed in browser storage.
- The plugin does not intentionally log keys, authorization headers or audio bytes.

### Network boundaries

- The browser uploads audio to the local DSH Host through a same-origin route protected by DSH connection authentication.
- The Host forwards requests to the ASR and text provider URLs configured by the user.
- **The configured URL is a trust boundary.** A malicious or mistaken URL can direct requests, including audio, to an unintended server, including private network addresses. Only configure endpoints you trust.
- Provider adapters must not perform network requests during URL detection.

### Prompt and content handling

- ASR transcripts and role prompts are sent to the configured second provider for Polish, Translate and Custom role modes.
- Generated text is inserted into the composer draft. It is not executed, but users should review inserted text before sending.
- Custom role prompts are user-controlled instructions and may alter output. Treat them as untrusted content when sharing configurations.

### Supply chain

- Published releases use npm provenance through GitHub Actions.
- Dependencies should remain minimal; prefer platform APIs.
- Provider adapter contributions are reviewed for credential leakage and unexpected network behavior.

## Out of scope

- Security of third-party ASR/LLM providers.
- Local attackers who can already read the user's DSH home directory.
- Browser or operating-system microphone permission bypasses.

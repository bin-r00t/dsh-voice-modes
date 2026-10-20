# Contributing to dsh-voice-modes

Thanks for helping improve voice input for DeepSeek Harness.

## Ways to contribute

- Add an ASR provider adapter.
- Report browser/recording bugs with reproduction details.
- Improve WAV conversion and audio compatibility.
- Add UI locales or improve Chinese/English copy.
- Add tests, docs or examples.
- Review provider requests and pull requests.

Good first issues are labeled `good first issue`. New provider requests use the **ASR provider request** issue template.

## Development setup

Requirements:

- Node.js 20+
- A working DSH installation
- A browser with microphone access

```bash
git clone https://github.com/bin-r00t/dsh-voice-modes.git
cd dsh-voice-modes
npm test
npm run check
```

Install the development copy through DSH Plugin Manager, or:

```bash
dsh plugin --profile web add "file:$PWD"
```

Host-side changes require restarting `dsh web`. Client-side changes are served through the Web HMR channel; refresh the page if needed.

### Test without a real provider

```bash
node debug/mock-provider.mjs
```

- Generic adapter: `http://127.0.0.1:8787/v1`
- MiMo adapter: `http://127.0.0.1:8787/v1#mimo`

The mock prints request method, path, content type and a summary of the body. It never prints API keys.

## Adding an ASR provider

Read [docs/adding-asr-provider.md](./docs/adding-asr-provider.md). In short:

1. Add an adapter to `BUILTIN_ASR_PROVIDERS` in `providers.js`, before the OpenAI-compatible fallback.
2. Implement `match`, `resolveModel`, `acceptsMime`, `buildRequest` and `extractText`.
3. Add provider tests in `test/providers.test.js`.
4. Add a route test in `test/host.test.js` if the request shape is new.
5. Update both READMEs and `CHANGELOG.md`.

Adapters must not:

- log API keys, audio bytes or authorization headers;
- make network requests during detection;
- assume they are the only provider;
- break the generic fallback.

## Pull requests

- Keep changes focused.
- Add tests for behavior changes.
- Run `npm run check && npm test`.
- Update docs when behavior or configuration changes.
- Never include real API keys, credentials or private audio.

The PR template includes a provider and security checklist.

## Commit and release conventions

- Use clear, imperative commit subjects.
- Maintainers update `CHANGELOG.md` and bump the version.
- Releases are tagged `vX.Y.Z`; the publish workflow runs on tags.

## Releasing

Maintainers follow [docs/releasing.md](./docs/releasing.md): update the changelog and version, push a `vX.Y.Z` tag, and let the publish workflow run. The repository needs an `NPM_TOKEN` secret with publish access to the `@nibuil` scope.

## Security

Do not open a public issue for a vulnerability. See [SECURITY.md](./SECURITY.md).

## License

By contributing, you agree that your contribution is licensed under the repository's [MIT License](./LICENSE).

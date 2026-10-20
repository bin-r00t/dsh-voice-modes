# Releasing and launch checklist

## One-time repository setup

1. Create the GitHub repository `bin-r00t/dsh-voice-modes`.
2. Confirm the npm scope `@nibuil` is available to your npm account. A username scope is created for that user; an organization scope requires access to the organization.

The GitHub repository and the npm scope use different owners:

- GitHub: `bin-r00t/dsh-voice-modes`
- npm: `@nibuil/dsh-voice-modes`

That is supported. Keep `repository`, `homepage` and `bugs` pointed at the GitHub repository so npm provenance can associate the package with the source repository.
3. In the GitHub repository, add a repository secret named `NPM_TOKEN` containing an npm automation token with publish access.
4. Enable GitHub Discussions, private vulnerability reporting, and branch protection for `main`.
5. Add labels used by the templates: `bug`, `enhancement`, `provider`, `good first issue`.

## Pre-release checks

```bash
npm run check
npm test
npm pack --dry-run
```

The package should contain only runtime files, both READMEs, the license and the icon. Tests, docs, `.github` and `debug` stay in the repository.

Verify the version in `package.json` and update `CHANGELOG.md`.

## Publish

```bash
git tag v0.1.0
git push origin v0.1.0
```

The tag triggers `.github/workflows/publish.yml`, which runs checks and publishes with npm provenance.

After the workflow succeeds:

```bash
npm view @nibuil/dsh-voice-modes version
```

Verify installation in a fresh DSH profile:

```bash
dsh plugin --profile web add @nibuil/dsh-voice-modes
```

Then test:

- the microphone button appears beside the model selector;
- settings open and save;
- the MiMo adapter works with an endpoint containing `mimo`;
- the generic adapter works with an OpenAI-compatible endpoint;
- Direct, Polish, Translate and Custom role modes insert text;
- no key appears in browser storage or API responses.

## Versioning

- `0.x` while DSH extension points may change.
- Patch releases: bug fixes and provider fixes.
- Minor releases: new adapters, modes, settings, compatibility updates.
- Major release at `1.0.0` when the adapter interface and settings format are stable.
- Update `engines.dsh` after testing a new DSH runtime.

## Launch checklist

- [ ] README has a working demo GIF or screenshot.
- [ ] Both READMEs have been proofread.
- [ ] Install command has been tested from npm.
- [ ] `NPM_TOKEN` and provenance are working.
- [ ] CI is green on Node 20, 22 and 24.
- [ ] Issue templates and Discussions are enabled.
- [ ] `good first issue` items are open.
- [ ] A short announcement exists in English and Chinese.
- [ ] The announcement clearly says this is a community plugin, not official DSH.
- [ ] Security reporting instructions are linked.

## Announcement outline

1. The problem: voice input with configurable modes and providers.
2. A 30-second demo.
3. Install command.
4. Supported adapters and how to add another.
5. Security model: Host-side keys, no browser secrets.
6. Compatibility and known limitations.
7. Call for contributions: providers, browser testing, translations.

# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed

- Refreshed the composer UI with an expanded recording row, live microphone waveform, formatted timer, cancel/stop controls, and a processing state.
- Added mode icons and richer selected states to the mode menu.
- Aligned spacing, focus rings, shadows and dark/light styling more closely with DSH controls.
- Cancel and error paths now release microphone resources without uploading a partial recording.
- Made the mode menu a pure-white floating surface with a stronger shadow and rounded mode icons.
- Reworked roles into a fixed-height 4-column grid that pages horizontally, so the menu height no longer grows with role count.
- Raised the settings surface above other floating layers.
- Turned Voice settings into a dedicated full-page view instead of a small modal.
- Kept the microphone and processing spinner perfectly circular; processing no longer expands the toolbar into a wide pill.
- Fixed spinner sizing so its width and height apply and it renders as a true circle.
- Flattened settings sections; hierarchy now comes from type scale and spacing rather than borders.
- Moved Add role into the section header as a prominent action and replaced inline role forms with light summary cards.
- Added a compact role detail dialog for editing or deleting one role at a time.
- Tuned spacing around the custom-role heading and role grid in the floating menu.

## [0.1.0] - 2026-10-20

### Added

- Circular microphone button and mode menu beside the composer model selector.
- Direct, Polish, Translate and Custom role modes.
- Built-in role examples and editable role prompts.
- ASR provider catalogue with URL-based adapter routing.
- Xiaomi MiMo ASR adapter using `chat/completions` and `input_audio`.
- OpenAI-compatible multipart transcription adapter.
- Automatic 16 kHz mono WAV conversion in the browser.
- Host-side settings at `~/.dsh/voice-modes/settings.json` with redacted API responses.
- Second provider for text processing and ASR fallback.
- English and Chinese plugin metadata and UI copy.
- Mock provider and automated provider/host tests.
- Initial community documentation, security policy and CI workflows.

[0.1.0]: https://github.com/bin-r00t/dsh-voice-modes/releases/tag/v0.1.0

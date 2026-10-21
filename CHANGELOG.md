# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [0.2.0] - 2026-10-21

### Added

- Dedicated full-page Voice settings surface with a fixed header, scrollable content and persistent save controls.
- Role detail dialog for creating, editing and deleting one role at a time.
- Prominent Add role action in the role section header.
- Light role summary cards with a two-line prompt preview.
- Live microphone waveform, formatted recording timer and cancel/stop controls.
- Mode icons and richer selected states in the floating mode menu.

### Changed

- Refreshed the composer UI and aligned spacing, focus rings, shadows and dark/light styling with DSH controls.
- Made the mode menu a pure-white floating surface with a stronger shadow and more rounded icons.
- Reworked roles into a fixed-height four-column grid that pages horizontally.
- Flattened settings sections; hierarchy now comes from type scale and spacing instead of borders.
- Processing now returns to a circular spinner button instead of expanding the toolbar into a wide pill.
- Tuned spacing around the custom-role heading and role grid.

### Fixed

- Microphone, capture controls and loading spinner now render as true circles.
- Fixed spinner sizing so its width and height apply.
- Cancel and error paths release microphone resources without uploading a partial recording.
- Raised the settings surface above other floating layers.

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

[0.2.0]: https://github.com/bin-r00t/dsh-voice-modes/releases/tag/v0.2.0
[0.1.0]: https://github.com/bin-r00t/dsh-voice-modes/releases/tag/v0.1.0

# Changelog

## v2.3.3 (2026-01-07)
### Fixed
- STT pre-warming: Recognition object initialized on mount, reused on each press
- Eliminated dropped first words from cold start delay (200-500ms savings)
- Added visual feedback: "Warming up..." → "Recording... Speak now"
- Users now know exactly when to start speaking

### UX
- sttReady state tracks actual listening status
- Recording indicator only shows green when truly ready

## v2.3.2 (2026-01-07)
### Fixed
- Multi-action handling: all results now reported (not just last one)
- Arabic error messages: all customer-facing text localized
- TTS preprocessing: synced between /api/chat and /api/tts
- Conversation flow: ACTIVE → CLOSED direct transition added

### Changed
- Response accumulator pattern for multiple tool calls
- State machine allows goodbye from ACTIVE state

## v2.3.1 (2026-01-06)
### Added
- Parallel DB queries (5 concurrent)
- Haiku fast-path for simple Arabic queries
- Split text/audio response pattern
- /api/tts standalone endpoint
- DB health check with 503 fast-fail

### Performance
- Simple queries: 5.8s → 2.1s (64% faster)
- Perceived latency: text appears before audio

## v2.3.0 (2026-01-06)
### Added
- Conversation lifecycle state machine
- Arabic-first system prompt (Saudi dialect)
- Analytics dashboard with funnel visualization
- Conversations tab in admin panel
- Drop-off tracking

### Fixed
- Microphone permissions policy
- STT language set to ar-SA
- Policy engine radius check enforcement

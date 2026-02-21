# Copilot Coding Agent Instructions

## Project Overview

Safe Transcript is a privacy-focused audio transcription app. It records audio, transcribes it with Mistral Voxtral Transcribe v2 Realtime, anonymizes PII using regex-based detection, and processes the result with a configurable LLM. The app is fully local — all data stored on-device in SQLite, audio in local filesystem, API calls made directly from the device.

## Repository Structure

- **Frontend** (`app/`, `components/`, `hooks/`, `services/`, `styles/`, `types/`): React Native + Expo app using Expo Router for navigation. No authentication — single-user local app.
- **Database** (`db/`): SQLite via `expo-sqlite` + Drizzle ORM. Schema in `db/schema.ts`, client in `db/client.ts`, CRUD operations in `db/operations/`.
- **Services** (`services/`): On-device processing — transcription (`transcription.ts`), PII anonymization (`anonymization.ts`), LLM processing (`llm.ts`), audio storage (`audioStorage.ts`), processing pipeline (`processing.ts`), local model management (`LocalModelManager.ts`).
- **Hooks** (`hooks/`): Custom React hooks (e.g., `useHybridTranscribe` for unified local/API transcription).

## Coding Conventions

- TypeScript throughout.
- Frontend uses functional React components with hooks.
- Imports use the `@/` path alias for the frontend root.
- ESLint is configured at the repo root (`.eslintrc.js`); run `npm run lint` from the repo root.

## Testing

- Run frontend lint: `npm run lint` (repo root).
- There is no automated test suite yet; validate changes by running the dev servers and exercising the relevant screens.

## Key Libraries

| Area | Library |
|---|---|
| Navigation | `expo-router` (sole router — do not add `react-router-dom` or standalone `@react-navigation/*` navigators) |
| Database | `expo-sqlite` + `drizzle-orm` |
| Audio | `expo-audio` |
| File storage | `expo-file-system` |
| On-device inference | `react-native-executorch` (mobile only) |
| LLM/Transcription | Raw `fetch` to OpenAI, Gemini, Mistral REST APIs |
| Maps (native) | WebView + Leaflet CDN (no npm map packages) |
| Maps (web) | iframe + Leaflet CDN (no `react-leaflet` — it conflicts with React 19) |
| Cross-platform scripts | `cross-env` (required for Windows compatibility) |

## Important Notes

- All data is stored locally — SQLite database via `expo-sqlite`, audio files via `expo-file-system`.
- API keys are stored in the local `api_keys` SQLite table and managed via the Settings screen.
- PII anonymization runs in `services/anonymization.ts` (regex-based, runs on-device).
- Transcription uses Mistral Voxtral API via raw `fetch` in `services/transcription.ts`. On mobile, the local Voxtral Mini 4B model (managed by `services/LocalModelManager.ts`) can be used when downloaded.
- The app requires the React Native New Architecture (`newArchEnabled: true` in `app.json`) for ExecuTorch support; Expo Go does not work — use a Development Build (`npx expo run:ios` / `run:android`).
- **Do not add DOM-only or browser-only npm packages** (e.g., `leaflet`, `react-leaflet`, `react-router-dom`). They conflict with React Native and/or React 19.
- **Do not add `--force` or `--legacy-peer-deps`** to npm install commands. Resolve peer dependency conflicts by finding compatible versions.
- npm scripts use `cross-env` for environment variables to ensure Windows compatibility.

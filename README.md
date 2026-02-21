# Safe Transcript

A privacy-focused audio transcription and analysis application. Safe Transcript records audio, transcribes it using **Mistral Voxtral Transcribe v2 Realtime**, anonymizes personally identifiable information (PII) using regex-based detection, and then processes the cleaned transcript with a configurable LLM for structured output (e.g., summaries, action items).

All data is stored locally on-device — SQLite database, local audio files, and API calls made directly from the device. No backend server required.

## Features

- **Audio recording** with in-app microphone capture
- **Speech-to-text** via Mistral Voxtral Transcribe v2 (with transcription keyword support for domain-specific terms), with optional on-device transcription using Voxtral Mini 4B through ExecuTorch on mobile
- **PII anonymization** — detects and masks phone numbers, emails, addresses, health IDs, credit card numbers, and more using regex-based detection
- **LLM analysis** — sends anonymized transcripts to a configurable LLM provider (OpenAI, Google Gemini, or Mistral) with a custom prompt
- **Project-based organization** — group recordings into projects with custom fields and export to CSV
- **Cross-platform** — runs on iOS, Android, and Web (Expo / React Native)
- **Fully local** — all data stored on-device in SQLite, API keys managed locally

## Repository Layout

```
├── app/                        # Screens (Expo Router)
│   ├── (tabs)/                 # Tab navigation
│   │   ├── index.tsx           #   Projects list
│   │   └── settings.tsx        #   Settings & API keys
│   ├── project/
│   │   ├── [id].tsx            #   Project detail & recordings list
│   │   └── create.tsx          #   Create project form
│   └── recording/
│       ├── [id].tsx            #   Recording detail (transcript, LLM output, audio player)
│       └── new.tsx             #   New recording (mic capture + upload)
├── components/                 # Shared UI components
├── db/                         # SQLite database (expo-sqlite + Drizzle ORM)
│   ├── client.ts               #   Native database client
│   ├── client.web.ts           #   Web database client (sql.js)
│   ├── schema.ts               #   Drizzle ORM schema
│   └── operations/             #   CRUD operations
├── hooks/                      # Custom React hooks
│   └── useHybridTranscribe.ts  #   Unified transcription (local or API)
├── services/                   # On-device services
│   ├── transcription.ts        #   Mistral Voxtral API via raw fetch
│   ├── anonymization.ts        #   Regex-based PII detection & masking
│   ├── llm.ts                  #   LLM provider abstraction (OpenAI, Gemini, Mistral)
│   ├── audioStorage.ts         #   Local audio file management
│   ├── processing.ts           #   Processing pipeline
│   └── LocalModelManager.ts    #   On-device model download & lifecycle
├── contexts/                   # React contexts
├── utils/                      # Error logger
├── styles/                     # Shared styles
├── types/                      # TypeScript type definitions
├── assets/                     # Images, fonts
└── public/                     # Static web assets
```

## Getting Started

### Prerequisites

- Node.js ≥ 20

### Installation

```bash
npm install
npm run dev          # Start Expo dev server
```

To build the APK for Android:
```ps1
npx eas-cli build -p android --profile preview
```

### API Keys

API keys (OpenAI, Gemini, Mistral) are entered in the Settings screen within the app and stored locally in the SQLite database. No environment variables needed.

## Processing Pipeline

```
Audio Recording
      │
      ▼
Voxtral Transcribe v2  ──►  Raw transcript (with timestamps & speaker labels)
(API or local Voxtral       On mobile, the local Voxtral Mini 4B model is used
 Mini 4B on mobile)         when downloaded; otherwise falls back to the API.
      │                     Web always uses the API.
      ▼
PII Anonymization       ──►  Masked transcript (regex-based, on-device)
      │
      ▼
LLM Analysis            ──►  Structured output (summary, action items, etc.)
```

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile / Web | React Native (0.81.x), Expo SDK 54, Expo Router |
| Database | SQLite (expo-sqlite), Drizzle ORM |
| Transcription | Mistral Voxtral Transcribe v2 (API), Voxtral Mini 4B via ExecuTorch (on-device) |
| PII Detection | Regex-based anonymization (on-device) |
| LLM Providers | OpenAI, Google Gemini, Mistral (via raw fetch) |

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Expo dev server with tunnel |
| `npm run web` | Start web-only dev server |
| `npm run lint` | Run ESLint |
| `npm run build:web` | Export web build |

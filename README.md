# GearGap — Diablo 4 Gear Companion

A full-stack web app that lets Diablo 4 players upload item screenshots, automatically extract stats via OCR, define a target build, and see exactly what is missing from their gear.

---

## Features

- **Armory** — Diablo 4-style inventory screen with 10 gear slots
- **Screenshot Upload** — drag & drop or click to upload item screenshots per slot
- **OCR Parsing** — OpenAI Vision API extracts item data from screenshots
- **Item Parser** — structured extraction of affixes, aspects, tempering, masterwork, gems/runes
- **Build System** — define target builds by pasting Maxroll-style text or entering manually
- **Comparison Engine** — per-slot match score (0–100%) with missing/wrong affix breakdown
- **Dark Theme** — Diablo 4-inspired UI with rarity colors and hover effects

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (httpOnly cookie) + bcrypt |
| OCR | OpenAI Vision API (pluggable) |
| State | React hooks + Server Components |

---

## Project Structure

```
app/
  api/
    auth/         login, register, logout, me
    ocr/          image → OCR → parse → store
    profiles/     gear profile CRUD + slot assignment
    builds/       target build CRUD
    compare/      run gear vs build comparison
  armory/         main inventory UI (server-rendered, client interactive)
  build/          create/manage target builds
  compare/        run comparisons, view results
  dashboard/      overview + quick navigation
  login/          auth pages
  register/

components/
  ArmorySlot      individual slot: upload, preview, state indicator
  ArmoryClient    full armory grid with character silhouette
  ItemDetailPanel slide-in panel with full item data + comparison
  ComparisonView  per-slot score breakdown
  ProgressBar     score bars with color coding
  NavBar          sidebar navigation
  UploadDropzone  reusable drag & drop image upload

lib/
  auth/           JWT session management, credential hashing
  db/             Prisma client singleton
  ocr/            OcrService interface + OpenAI Vision implementation
  parser/         D4 tooltip parser + build text parser
  comparison/     comparison engine
  types.ts        all shared types
  utils.ts        cn() utility

prisma/
  schema.prisma   User, Session, Item, GearProfile, Build models
```

---

## Setup

### 1. Prerequisites

- Node.js 18+
- PostgreSQL database

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Copy `.env.example` to `.env` and fill in:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/geargap"
JWT_SECRET="your-long-random-secret"
OPENAI_API_KEY="sk-..."   # optional — mock OCR used if blank
```

### 4. Set up database

```bash
npx prisma db push
npx prisma generate
```

### 5. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## OCR

The OCR service is pluggable. The default uses **OpenAI GPT-4o Vision**.

If `OPENAI_API_KEY` is not set, a **mock OCR** returns a sample Diablo 4 tooltip so you can develop without an API key.

To swap in a different OCR provider (Google Vision, Azure CV, etc.), implement the `OcrService` interface in `lib/ocr/ocrService.ts`:

```ts
export interface OcrService {
  extractText(imageBase64: string, mimeType: string): Promise<OcrRawOutput>
}
```

---

## Build Parser

Paste Maxroll-style text into the Build page:

```
Helmet: Cooldown Reduction, Max Life, Armor
Gloves: Attack Speed, Crit Chance, Lucky Hit
Boots: Movement Speed, Dodge Chance
```

The parser maps slot names → `BuildSlotRequirement` with `required: true` affixes.

---

## Comparison Scoring

Per slot:
- **Score = required affixes matched / total required × 100**
- Aspect present adds 20% (score split 80/20 if aspect required)

Color coding: Green ≥80%, Yellow ≥50%, Red <50%

---

## Deployment (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

For image storage, replace the base64 `imageUrl` in `app/api/ocr/route.ts` with Vercel Blob:

```ts
import { put } from '@vercel/blob'
const blob = await put(file.name, file, { access: 'public' })
const imageUrl = blob.url
```

---

## Database commands

```bash
npm run db:push      # push schema changes to DB
npm run db:generate  # regenerate Prisma client
npm run db:studio    # open Prisma Studio
```

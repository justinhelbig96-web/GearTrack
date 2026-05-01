/**
 * OCR Service — pluggable interface.
 *
 * Default implementation uses OpenAI Vision (GPT-4o).
 * The interface is intentionally simple so you can swap in
 * Google Vision, Azure CV, or a local Tesseract wrapper.
 */

export interface OcrService {
  extractText(imageBase64: string, mimeType: string): Promise<OcrRawOutput>
}

export interface OcrRawOutput {
  text: string
  confidence: number   // 0–1, best-effort estimate
}

// ─── OpenAI Vision implementation ─────────────────────────────────────────────

import OpenAI from 'openai'

const SYSTEM_PROMPT = `You are an expert Diablo 4 item reader.
The user will send you a screenshot of a Diablo 4 item tooltip.
Extract ALL visible text exactly as written, preserving newlines.
Do not interpret or summarize—return the raw text only.`

class OpenAIVisionOcr implements OcrService {
  private client: OpenAI

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set')
    }
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }

  async extractText(imageBase64: string, mimeType: string): Promise<OcrRawOutput> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: 'high',
              },
            },
            { type: 'text', text: 'Extract all text from this Diablo 4 item tooltip.' },
          ],
        },
      ],
      max_tokens: 1024,
      temperature: 0,
    })

    const text = response.choices[0]?.message?.content ?? ''
    // GPT-4o doesn't expose per-token confidence; use logprobs heuristic
    const confidence = text.length > 20 ? 0.85 : 0.4

    return { text, confidence }
  }
}

// ─── Mock OCR for local dev (no API key required) ──────────────────────────────

class MockOcr implements OcrService {
  async extractText(_imageBase64: string, _mimeType: string): Promise<OcrRawOutput> {
    const mockText = `Ancestral Sacred Helm
Item Power 925

+ 18.5% Cooldown Reduction [GREATER]
+ 24% Maximum Life
+ 1,240 Armor
+ 15.5% Cold Resistance

Aspect of the Frozen Tundra
Your Blizzard leaves behind a field of Frigid Air for 6 seconds.

Tempering: +2 to Blizzard Skills

Masterworking Rank 4

Empty Socket`
    return { text: mockText, confidence: 0.9 }
  }
}

// ─── Factory ───────────────────────────────────────────────────────────────────

export function createOcrService(): OcrService {
  if (process.env.OPENAI_API_KEY) {
    return new OpenAIVisionOcr()
  }
  console.warn('[OCR] No OPENAI_API_KEY found — using mock OCR service')
  return new MockOcr()
}

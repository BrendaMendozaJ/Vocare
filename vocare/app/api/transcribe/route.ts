import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
// gemini-1.5-flash has documented audio support across all formats
const MODEL = 'gemini-1.5-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`

export async function POST(req: NextRequest) {
  try {
    const { audio, mimeType, lang } = await req.json() as {
      audio: string
      mimeType: string
      lang: string
    }

    if (!audio) {
      return NextResponse.json({ error: 'No audio data received' }, { status: 400 })
    }

    const langInstruction = lang === 'es'
      ? 'The speaker is using Spanish (Peruvian accent). Transcribe exactly.'
      : 'The speaker may use English, Twi, Ga, Ewe, Dagbani, or another Ghanaian language. Transcribe exactly as spoken.'

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'audio/webm',
                data: audio,
              },
            },
            {
              text: `Transcribe this audio. ${langInstruction} Return only the transcription text — no labels, no quotes, no explanation.`,
            },
          ],
        }],
        generationConfig: { temperature: 0 },
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      return NextResponse.json(
        { error: err.error?.message ?? 'Gemini transcription error' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const text = (data.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim()
    return NextResponse.json({ text })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

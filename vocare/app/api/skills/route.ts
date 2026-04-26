import { NextRequest, NextResponse } from 'next/server'
import type { SkillsInput, SkillsProfile } from '@/lib/types'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const MODEL = 'gemini-3-flash-preview'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`

async function callGemini(prompt: string, retries = 3): Promise<string> {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 }
      })
    })

    if (response.ok) {
      const data = await response.json()
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    }

    const err = await response.json()
    console.log(`Attempt ${i+1} failed:`, response.status, err.error?.status)

    // Solo retry en 503 y 429 con delay
    if (response.status === 503 || response.status === 429) {
      await new Promise(r => setTimeout(r, 2000 * (i + 1)))
      continue
    }

    throw new Error(`Gemini error ${response.status}: ${err.error?.message}`)
  }
  throw new Error('Max retries reached')
}

export async function POST(req: NextRequest) {
  const body: SkillsInput = await req.json()
  console.log('KEY:', GEMINI_API_KEY ? `${GEMINI_API_KEY.slice(0,8)}...` : 'UNDEFINED')

  const wordCount = body.text.trim().split(/\s+/).filter(Boolean).length
  if (wordCount < 8) {
    return NextResponse.json({
      error: 'insufficient_input',
      message: body.language === 'es'
        ? 'Por favor describe tu experiencia con más detalle — mínimo 2-3 oraciones ayudan a identificar tus habilidades.'
        : 'Please describe your experience in more detail — at least 2–3 sentences help us identify your skills.'
    }, { status: 400 })
  }

  const ghanaLangNote = body.country === 'GHA'
    ? '\nIMPORTANT: The user may write in English, Twi, Ga, Ewe, Dagbani, or another Ghanaian language. Translate internally and process as normal English input.'
    : ''

  const prompt = `
You are a labor market expert. A young person from ${body.country} describes their skills:

"${body.text}"
${ghanaLangNote}

Map this to a standardized skills profile. Respond ONLY with a valid JSON object, no markdown, no explanation.

Required format:
{
  "isco_code": "4-digit ISCO-08 code (string)",
  "isco_title_es": "occupation title in Spanish",
  "isco_title_en": "occupation title in English",
  "education_level": "none|primary|secondary|technical|tertiary",
  "portability_score": 0.0,
  "countries_recognized": 190,
  "skills": [
    {
      "id": "s1",
      "label_es": "skill name in Spanish",
      "label_en": "skill name in English",
      "type": "technical|digital|transversal|language",
      "level": "basic|intermediate|advanced"
    }
  ]
}

Rules:
- Extract 4 to 8 skills from the description
- Be honest and specific, not aspirational — do NOT invent skills not mentioned
- If the input contains fewer than 3 meaningful skill signals, return portability_score below 0.3 and at most 2 skills
- ISCO code must be a real ISCO-08 4-digit code
- portability_score: 1.0 = recognized everywhere, 0.0 = very local
`

  try {
    const rawText = await callGemini(prompt)
    const clean = rawText.replace(/```json|```/g, '').trim()
    const profile: SkillsProfile = JSON.parse(clean)
    return NextResponse.json(profile)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

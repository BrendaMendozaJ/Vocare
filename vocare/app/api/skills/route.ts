import { NextRequest, NextResponse } from 'next/server'
import type { SkillsInput, SkillsProfile } from '@/lib/types'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

export async function POST(req: NextRequest) {
  const body: SkillsInput = await req.json()

  const prompt = `
You are a labor market expert. A young person from ${body.country} describes their skills:

"${body.text}"

Map this to a standardized skills profile. Respond ONLY with a valid JSON object, no markdown, no explanation.

Required format:
{
  "isco_code": "4-digit ISCO-08 code (string)",
  "isco_title_es": "occupation title in Spanish",
  "isco_title_en": "occupation title in English",
  "education_level": "none|primary|secondary|technical|tertiary",
  "portability_score": 0.0 to 1.0 (how portable this skill is across countries),
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
- Be honest and specific, not aspirational
- ISCO code must be a real ISCO-08 4-digit code
- portability_score: 1.0 = recognized everywhere, 0.0 = very local
`

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2 }
    })
  })

  if (!response.ok) {
    return NextResponse.json({ error: 'Gemini API error' }, { status: 500 })
  }

  const geminiData = await response.json()
  const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  try {
    const clean = rawText.replace(/```json|```/g, '').trim()
    const profile: SkillsProfile = JSON.parse(clean)
    return NextResponse.json(profile)
  } catch {
    return NextResponse.json({ error: 'Failed to parse LLM response', raw: rawText }, { status: 500 })
  }
}

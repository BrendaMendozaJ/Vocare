import { NextRequest, NextResponse } from 'next/server'
import type { SkillsInput, SkillsProfile } from '@/lib/types'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`

export async function POST(req: NextRequest) {
  // Debug temporal
  console.log('KEY:', GEMINI_API_KEY ? `${GEMINI_API_KEY.slice(0,8)}...` : 'UNDEFINED')

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
`

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2 }
    })
  })

  console.log('Gemini status:', response.status)

  if (!response.ok) {
    const errText = await response.text()
    console.log('Gemini error body:', errText)
    return NextResponse.json({ error: 'Gemini API error', status: response.status, detail: errText }, { status: 500 })
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

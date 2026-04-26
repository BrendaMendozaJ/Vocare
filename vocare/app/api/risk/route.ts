import { NextRequest, NextResponse } from 'next/server'
import type { SkillsProfile, RiskProfile } from '@/lib/types'
import freyLookup from '@/lib/data/frey_isco_lookup.json'
import wittGHA from '@/lib/data/witt_GHA.json'
import wittPER from '@/lib/data/witt_PER.json'
import ghanaConfig from '@/config/countries/ghana.json'
import peruConfig from '@/config/countries/peru.json'

const ADJACENT_SKILLS: Record<string, string[]> = {
  "1": ["Gestión de equipos remotos", "Planificación estratégica digital"],
  "2": ["Prompting avanzado con IA", "Análisis de datos con Python"],
  "3": ["Diagnóstico remoto IoT", "Soporte técnico B2B", "Reparación de drones"],
  "4": ["Automatización con Excel/Sheets", "Análisis de datos básico"],
  "5": ["Atención virtual al cliente", "Gestión de redes sociales"],
  "6": ["Agricultura de precisión", "Gestión de cadena de frío"],
  "7": ["Diagnóstico remoto IoT", "Reparación de drones", "Soporte técnico B2B"],
  "8": ["Supervisión de máquinas CNC", "Control de calidad digital"],
  "9": ["Logística de última milla", "Emprendimiento digital básico"],
}

export async function POST(req: NextRequest) {
  const { profile, country }: { profile: SkillsProfile; country: string } = await req.json()

  const config = country === 'PER' ? peruConfig : ghanaConfig
  const witt = country === 'PER' ? wittPER : wittGHA

  // Buscar score de Frey-Osborne
  const majorGroup = profile.isco_code?.[0] ?? '5'
  const lookup = freyLookup as any
  const rawScore: number =
    lookup.by_isco_4digit?.[profile.isco_code] ??
    lookup.by_major_group?.[majorGroup] ??
    0.5

  // Calibrar para LMIC
  const adjustedScore = Math.round(rawScore * config.lmic_factor * 100) / 100

  // Clasificar skills
  const durableSkills = profile.skills
    .filter(s => s.type === 'digital' || s.type === 'transversal' || s.type === 'language')
    .map(s => s.label_en)

  const atRiskSkills = profile.skills
    .filter(s => s.type === 'technical' && adjustedScore > 0.5)
    .map(s => s.label_en)

  const adjacentSkills = ADJACENT_SKILLS[majorGroup] ?? [
    "Comunicación digital", "Gestión de proyectos básica"
  ]

  const riskProfile: RiskProfile = {
    raw_score: rawScore,
    lmic_factor: config.lmic_factor,
    adjusted_score: adjustedScore,
    risk_label: adjustedScore < 0.35 ? 'bajo' : adjustedScore < 0.65 ? 'medio' : 'alto',
    durable_skills: durableSkills,
    at_risk_skills: atRiskSkills,
    adjacent_skills: adjacentSkills,
    wittgenstein: witt.projections
  }

  return NextResponse.json(riskProfile)
}

// Contrato entre César (BE) y Brenda (FE) — no modificar sin avisar

export interface SkillsInput {
  text: string        // texto libre de Amara
  country: string     // "PER" | "GHA"
  language: string    // "es" | "en"
}

export interface Skill {
  id: string
  label_es: string
  label_en: string
  type: 'technical' | 'digital' | 'transversal' | 'language'
  level: 'basic' | 'intermediate' | 'advanced'
}

export interface SkillsProfile {
  isco_code: string
  isco_title_es: string
  isco_title_en: string
  skills: Skill[]
  education_level: string
  portability_score: number       // 0-1
  countries_recognized: number    // siempre 190
}

export interface RiskProfile {
  raw_score: number
  lmic_factor: number
  adjusted_score: number
  risk_label: 'bajo' | 'medio' | 'alto'
  durable_skills: string[]
  at_risk_skills: string[]
  adjacent_skills: string[]
  wittgenstein: {
    year: number
    no_education: number
    primary: number
    lower_secondary: number
    upper_secondary: number
    post_secondary: number
    tertiary: number
  }[]
}

export interface CountryConfig {
  country_code: string
  country_name: string
  language: string
  currency: string
  lmic_factor: number
  wdi_file: string
  ilo_file: string
  witt_file: string
  job_search_domains: string[]
  min_wage_usd_month: number
  informal_economy_pct: number
  youth_unemployment_pct: number
  internet_penetration_pct: number
}

export interface MatchProfile {
  matched_sectors: {
    name: string
    employment_thousands: number
    pct_of_total: number
    trend: string
    relevance: 'high' | 'medium' | 'low'
  }[]
  econometric_signals: {
    id: string
    label: string
    value: number
    unit: string
    year: number
    source: string
    interpretation: string
  }[]
  labor_market_alert: {
    warning: string
    ratio?: string
    vocare_actionable: string
    source: string
  }
  opportunities: {
    title: string
    type: 'formal' | 'self_employment' | 'gig' | 'training'
    sector: string
    wage_estimate_usd_month: number | null
    realistic: boolean
    note: string
  }[]
  job_search_links: string[]
  sources: string[]
}

import { NextRequest, NextResponse } from 'next/server'
import type { SkillsProfile, MatchProfile } from '@/lib/types'
import signals_GHA from '@/lib/data/signals_GHA.json'
import signals_PER from '@/lib/data/signals_PER.json'
import ilo_GHA from '@/lib/data/ilo_employment_GHA.json'
import config_GHA from '@/config/countries/ghana.json'
import config_PER from '@/config/countries/peru.json'

type OpportunityType = 'formal' | 'self_employment' | 'gig' | 'training'

type OpportunityTemplate = {
  title: string
  type: OpportunityType
  sector: string
  wage_estimate_usd_month: number | null
  note: string
}

const ISCO_TO_SECTORS: Record<string, string[]> = {
  '1': ['Services', 'Non-agriculture'],
  '2': ['Services'],
  '3': ['Industry', 'Services'],
  '4': ['Services'],
  '5': ['Services'],
  '6': ['Agriculture'],
  '7': ['Services', 'Non-agriculture'],
  '8': ['Industry'],
  '9': ['Agriculture', 'Services'],
}

// Peru ILO file only has metadata; use INEI/WB estimates (thousands)
const PER_SECTOR_DATA: Record<string, { employment_thousands: number; pct_of_total: number }> = {
  'Services': { employment_thousands: 10850, pct_of_total: 65.2 },
  'Agriculture': { employment_thousands: 3920, pct_of_total: 23.6 },
  'Industry': { employment_thousands: 1890, pct_of_total: 11.2 },
  'Non-agriculture': { employment_thousands: 12740, pct_of_total: 76.4 },
}

const OPPORTUNITIES_BY_ISCO: Record<string, OpportunityTemplate[]> = {
  '7': [
    { title: 'Phone & Laptop Repair Technician', type: 'self_employment', sector: 'Services', wage_estimate_usd_month: 115, note: 'High demand in urban areas; low startup cost for basic tool kit.' },
    { title: 'Electronics Repair (On-demand / Gig)', type: 'gig', sector: 'Services', wage_estimate_usd_month: 60, note: 'Local WhatsApp groups and platforms like Fiverr for on-demand repair calls.' },
    { title: 'Digital Skills Trainer', type: 'formal', sector: 'Services', wage_estimate_usd_month: 175, note: 'NGOs and community centers actively seek local trainers with hands-on tech experience.' },
  ],
  '2': [
    { title: 'Software / Web Developer', type: 'formal', sector: 'Services', wage_estimate_usd_month: 400, note: 'Growing demand in Accra and Lima tech hubs.' },
    { title: 'Online Freelancer (Tech Services)', type: 'gig', sector: 'Services', wage_estimate_usd_month: 300, note: 'Upwork, Toptal — remote income in USD accessible with reliable internet.' },
  ],
  '5': [
    { title: 'Customer Service Representative', type: 'formal', sector: 'Services', wage_estimate_usd_month: 125, note: 'Call centers and e-commerce companies hire continuously.' },
    { title: 'E-commerce Seller', type: 'self_employment', sector: 'Services', wage_estimate_usd_month: 140, note: 'Sell on Jumia (GHA) or Mercado Libre (PER) with zero storefront cost.' },
  ],
  '6': [
    { title: 'Cooperative / Smallholder Farmer', type: 'self_employment', sector: 'Agriculture', wage_estimate_usd_month: 80, note: 'Joining a cooperative increases bargaining power and access to credit.' },
    { title: 'Agricultural Input Reseller', type: 'self_employment', sector: 'Agriculture', wage_estimate_usd_month: 70, note: 'Reselling seeds, fertilizers, and tools at local market — minimal capital needed.' },
  ],
  '4': [
    { title: 'Office Administrator', type: 'formal', sector: 'Services', wage_estimate_usd_month: 130, note: 'SMEs and NGOs consistently need admin support.' },
    { title: 'Virtual Assistant (Remote)', type: 'gig', sector: 'Services', wage_estimate_usd_month: 200, note: 'Remote work accessible via Fiverr or Upwork with basic English and PC skills.' },
  ],
  '8': [
    { title: 'Machine Operator / Technician', type: 'formal', sector: 'Industry', wage_estimate_usd_month: 150, note: 'Manufacturing and mining sectors actively recruit.' },
    { title: 'Equipment Maintenance (On-call)', type: 'gig', sector: 'Industry', wage_estimate_usd_month: 100, note: 'On-call maintenance for factories and workshops.' },
  ],
  '1': [
    { title: 'SME Manager / Entrepreneur', type: 'self_employment', sector: 'Services', wage_estimate_usd_month: 250, note: 'Management skills transfer directly to running a micro-enterprise.' },
    { title: 'Community Program Coordinator', type: 'formal', sector: 'Services', wage_estimate_usd_month: 180, note: 'NGOs and government programs value local leadership experience.' },
  ],
  '3': [
    { title: 'Technical Specialist / Field Inspector', type: 'formal', sector: 'Industry', wage_estimate_usd_month: 220, note: 'Quality control and technical inspection roles in growing industries.' },
    { title: 'Vocational Trainer (TVET)', type: 'formal', sector: 'Services', wage_estimate_usd_month: 160, note: 'TVET institutions need experienced practitioners as instructors.' },
  ],
  '9': [
    { title: 'Market Trader / Informal Vendor', type: 'self_employment', sector: 'Services', wage_estimate_usd_month: 70, note: 'Entry-level entrepreneurship with very low startup cost.' },
    { title: 'Delivery / Logistics Rider', type: 'gig', sector: 'Services', wage_estimate_usd_month: 90, note: 'Bolt Food, Glovo (PER) and local delivery platforms actively hiring.' },
  ],
}

function getSectorTrend(signals: typeof signals_GHA | typeof signals_PER, sectorName: string): string {
  const updates = (signals as Record<string, unknown>).sector_employment_update as Array<{ sector: string; trend_2025: string }> | undefined
  if (!updates) return 'stable'
  const match = updates.find((s) => s.sector === sectorName || s.sector.startsWith(sectorName))
  return match?.trend_2025 ?? 'stable'
}

function getGhaSectorData(sectorName: string): { employment_thousands: number; pct_of_total: number } | null {
  const bySector = (ilo_GHA as Record<string, unknown>).by_sector as Record<string, Array<{ year: string; value_thousands: number }>> | undefined
  if (!bySector) return null
  const arr = bySector[sectorName]
  const total = bySector['Total']
  if (!arr || !total || arr.length === 0 || total.length === 0) return null
  const latest = arr[arr.length - 1]
  const latestTotal = total[total.length - 1]
  return {
    employment_thousands: Math.round(latest.value_thousands),
    pct_of_total: Math.round((latest.value_thousands / latestTotal.value_thousands) * 1000) / 10,
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: { profile: SkillsProfile; country: string } = await req.json()
    const { profile, country } = body

    if (!profile?.isco_code || !country) {
      return NextResponse.json({ error: 'Missing profile or country' }, { status: 400 })
    }

    const isGHA = country === 'GHA'
    const signals = isGHA ? signals_GHA : signals_PER
    const config = isGHA ? config_GHA : config_PER
    const majorGroup = profile.isco_code[0] ?? '9'
    const targetSectors = ISCO_TO_SECTORS[majorGroup] ?? ['Services']

    // matched_sectors
    const matched_sectors: MatchProfile['matched_sectors'] = []
    for (const [idx, sectorName] of targetSectors.entries()) {
      const sectorData = isGHA ? getGhaSectorData(sectorName) : (PER_SECTOR_DATA[sectorName] ?? null)
      if (!sectorData) continue
      matched_sectors.push({
        name: sectorName,
        employment_thousands: sectorData.employment_thousands,
        pct_of_total: sectorData.pct_of_total,
        trend: getSectorTrend(signals, sectorName),
        relevance: idx === 0 ? 'high' : 'medium',
      })
    }

    // econometric_signals
    const raw_signals = (signals as Record<string, unknown>).key_signals as Array<{
      id: string; label: string; value: number; unit: string; year: number; source: string; interpretation: string
    }>
    const econometric_signals: MatchProfile['econometric_signals'] = raw_signals.slice(0, 3).map((s) => ({
      id: s.id,
      label: s.label,
      value: s.value,
      unit: s.unit,
      year: s.year,
      source: s.source,
      interpretation: s.interpretation,
    }))

    // labor_market_alert
    const alertRaw = (signals as Record<string, unknown>).labor_market_gap_alert as Record<string, string>
    const labor_market_alert: MatchProfile['labor_market_alert'] = {
      warning: alertRaw.warning,
      ratio: alertRaw.ratio,
      vocare_actionable: alertRaw.vocare_actionable,
      source: alertRaw.source,
    }

    // opportunities
    const baseOpps = OPPORTUNITIES_BY_ISCO[majorGroup] ?? OPPORTUNITIES_BY_ISCO['9']
    const minWage = config.min_wage_usd_month
    const opportunities: MatchProfile['opportunities'] = baseOpps.map((opp) => ({
      ...opp,
      realistic: opp.wage_estimate_usd_month !== null && opp.wage_estimate_usd_month >= minWage,
    }))

    // job_search_links
    const job_search_links = (config.job_search_domains as string[]).map((d) => `https://${d}`)

    // sources
    const sources = (signals as Record<string, unknown>).sources as string[]

    const result: MatchProfile = {
      matched_sectors,
      econometric_signals,
      labor_market_alert,
      opportunities,
      job_search_links,
      sources,
    }

    return NextResponse.json(result)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

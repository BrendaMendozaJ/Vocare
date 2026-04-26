import { NextRequest, NextResponse } from 'next/server'
import ghanaConfig from '@/config/countries/ghana.json'
import peruConfig from '@/config/countries/peru.json'

export async function GET(req: NextRequest) {
  const country = req.nextUrl.searchParams.get('country') ?? 'GHA'
  const config = country === 'PER' ? peruConfig : ghanaConfig
  return NextResponse.json(config)
}

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter')
    const top = searchParams.get('top')
    const orderby = searchParams.get('orderby')

    let url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/mde/alerts`
    const params = new URLSearchParams()
    if (filter) params.append('filter', filter)
    if (top) params.append('top', top)
    if (orderby) params.append('orderby', orderby)
    if (params.toString()) url += `?${params.toString()}`

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
  }
}

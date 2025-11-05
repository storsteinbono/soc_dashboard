import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { data: modules, error } = await supabase
      .from('modules')
      .select('*')
      .order('name')

    if (error) {
      throw error
    }

    return NextResponse.json({
      total: modules?.length || 0,
      modules: modules || []
    })
  } catch (error) {
    console.error('Error fetching modules:', error)
    return NextResponse.json({
      total: 0,
      modules: []
    }, { status: 500 })
  }
}

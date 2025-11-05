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

    // Transform data to match Dashboard component expectations
    const transformedModules = modules?.map(module => ({
      name: module.name,
      status: module.status,
      info: {
        name: module.display_name,
        description: module.description,
        capabilities: Array.isArray(module.capabilities)
          ? module.capabilities
          : (module.capabilities || [])
      },
      version: module.version,
      requires_api_key: module.requires_api_key,
      health_status: module.health_status
    })) || []

    return NextResponse.json({
      total: transformedModules.length,
      modules: transformedModules
    })
  } catch (error) {
    console.error('Error fetching modules:', error)
    return NextResponse.json({
      total: 0,
      modules: []
    }, { status: 500 })
  }
}

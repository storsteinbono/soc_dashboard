import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check database connection
    const { data: modules, error } = await supabase
      .from('modules')
      .select('name, status, health_status')

    if (error) {
      return NextResponse.json({
        status: 'unhealthy',
        message: error.message,
        modules_loaded: 0,
        modules: {}
      })
    }

    const moduleHealth: Record<string, any> = {}
    modules?.forEach(module => {
      moduleHealth[module.name] = module.health_status || { status: module.status }
    })

    return NextResponse.json({
      status: 'healthy',
      modules_loaded: modules?.filter(m => m.status === 'active').length || 0,
      modules: moduleHealth
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to check health',
      modules_loaded: 0,
      modules: {}
    }, { status: 500 })
  }
}

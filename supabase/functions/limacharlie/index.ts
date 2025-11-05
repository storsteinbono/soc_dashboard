import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { LimaCharlieModule } from './module.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { method } = req
    const url = new URL(req.url)
    const path = url.pathname.split('/').filter(Boolean).slice(1)

    const config = {
      api_key: Deno.env.get('LIMACHARLIE_API_KEY') || '',
      organization_id: Deno.env.get('LIMACHARLIE_ORG_ID') || '',
    }

    const module = new LimaCharlieModule(config)
    await module.initialize()

    // GET /limacharlie - Module info
    if (path.length === 0 && method === 'GET') {
      return new Response(
        JSON.stringify(module.getInfo()),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /limacharlie/health
    if (path[0] === 'health') {
      const health = await module.healthCheck()
      return new Response(
        JSON.stringify(health),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /limacharlie/sensors - List sensors
    if (path[0] === 'sensors' && method === 'GET' && path.length === 1) {
      const sensors = await module.listSensors()
      return new Response(
        JSON.stringify(sensors),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /limacharlie/sensors/{id} - Get sensor
    if (path[0] === 'sensors' && method === 'GET' && path.length === 2) {
      const sensor = await module.getSensor(path[1])
      return new Response(
        JSON.stringify(sensor),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /limacharlie/sensors/{id}/isolate
    if (path.length === 3 && path[0] === 'sensors' && path[2] === 'isolate' && method === 'POST') {
      const success = await module.isolateSensor(path[1])
      return new Response(
        JSON.stringify({ success, message: success ? 'Sensor isolated' : 'Failed to isolate sensor' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /limacharlie/detections
    if (path[0] === 'detections' && method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '100')
      const detections = await module.listDetections(limit)
      return new Response(
        JSON.stringify(detections),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
    )

  } catch (error) {
    console.error('LimaCharlie function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

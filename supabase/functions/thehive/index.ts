import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { TheHiveModule } from './module.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { method } = req
    const url = new URL(req.url)
    const path = url.pathname.split('/').filter(Boolean).slice(1) // Remove 'thehive'

    // Get config from environment or request
    const config = {
      api_url: Deno.env.get('THEHIVE_API_URL') || '',
      api_key: Deno.env.get('THEHIVE_API_KEY') || '',
      verify_ssl: Deno.env.get('THEHIVE_VERIFY_SSL') !== 'false',
    }

    const module = new TheHiveModule(config)
    await module.initialize()

    // Route requests
    if (path.length === 0) {
      // GET /thehive - Get module info
      if (method === 'GET') {
        return new Response(
          JSON.stringify(module.getInfo()),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    if (path[0] === 'health') {
      // GET /thehive/health
      const health = await module.healthCheck()
      return new Response(
        JSON.stringify(health),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (path[0] === 'cases') {
      // GET /thehive/cases - List cases
      if (method === 'GET' && path.length === 1) {
        const limit = parseInt(url.searchParams.get('limit') || '10')
        const sort = url.searchParams.get('sort') || '-startDate'
        const cases = await module.listCases(limit, sort)
        return new Response(
          JSON.stringify(cases),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // POST /thehive/cases - Create case
      if (method === 'POST' && path.length === 1) {
        const body = await req.json()
        const newCase = await module.createCase(
          body.title,
          body.description,
          body.severity,
          body.tlp,
          body.tags
        )
        return new Response(
          JSON.stringify(newCase),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
        )
      }

      // GET /thehive/cases/{id} - Get case
      if (method === 'GET' && path.length === 2) {
        const caseData = await module.getCase(path[1])
        return new Response(
          JSON.stringify(caseData),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // PUT /thehive/cases/{id} - Update case
      if (method === 'PUT' && path.length === 2) {
        const body = await req.json()
        const success = await module.updateCase(path[1], body.fields)
        return new Response(
          JSON.stringify({ success, message: success ? 'Case updated' : 'Failed to update case' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    if (path[0] === 'alerts') {
      // GET /thehive/alerts - List alerts
      if (method === 'GET' && path.length === 1) {
        const limit = parseInt(url.searchParams.get('limit') || '10')
        const alerts = await module.listAlerts(limit)
        return new Response(
          JSON.stringify(alerts),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
    )

  } catch (error) {
    console.error('TheHive function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { MdeModule } from './module.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { method } = req
    const url = new URL(req.url)
    const path = url.pathname.split('/').filter(Boolean).slice(1) // Remove 'mde'

    // Get config from environment
    const config = {
      tenant_id: Deno.env.get('MDE_TENANT_ID') || '',
      client_id: Deno.env.get('MDE_CLIENT_ID') || '',
      client_secret: Deno.env.get('MDE_CLIENT_SECRET') || '',
    }

    const module = new MdeModule(config)
    await module.initialize()

    // Route requests
    if (path.length === 0) {
      // GET /mde - Get module info
      if (method === 'GET') {
        return new Response(
          JSON.stringify(module.getInfo()),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // GET /mde/health
    if (path[0] === 'health') {
      const health = await module.healthCheck()
      return new Response(
        JSON.stringify(health),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /mde/capabilities
    if (path[0] === 'capabilities') {
      const capabilities = module.getCapabilities()
      return new Response(
        JSON.stringify(capabilities),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ==================== Machine Endpoints ====================

    if (path[0] === 'machines') {
      // GET /mde/machines - List machines
      if (method === 'GET' && path.length === 1) {
        const filter = url.searchParams.get('filter') || undefined
        const top = url.searchParams.get('top') ? parseInt(url.searchParams.get('top')!) : undefined
        const machines = await module.listMachines(filter, top)
        return new Response(
          JSON.stringify(machines),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // GET /mde/machines/{id} - Get machine
      if (method === 'GET' && path.length === 2) {
        const machine = await module.getMachine(path[1])
        return new Response(
          JSON.stringify(machine),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // GET /mde/machines/{id}/users - Get machine users
      if (method === 'GET' && path.length === 3 && path[2] === 'users') {
        const users = await module.getMachineUsers(path[1])
        return new Response(
          JSON.stringify(users),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // POST /mde/machines/{id}/isolate - Isolate machine
      if (method === 'POST' && path.length === 3 && path[2] === 'isolate') {
        const body = await req.json()
        const result = await module.isolateMachine(
          path[1],
          body.isolationType || 'Full',
          body.comment
        )
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // POST /mde/machines/{id}/unisolate - Unisolate machine
      if (method === 'POST' && path.length === 3 && path[2] === 'unisolate') {
        const body = await req.json()
        const result = await module.unisolateMachine(path[1], body.comment)
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // POST /mde/machines/{id}/scan - Run AV scan
      if (method === 'POST' && path.length === 3 && path[2] === 'scan') {
        const body = await req.json()
        const result = await module.runAVScan(
          path[1],
          body.scanType || 'Quick',
          body.comment
        )
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // POST /mde/machines/{id}/stopandquarantinefile - Quarantine file
      if (method === 'POST' && path.length === 3 && path[2] === 'stopandquarantinefile') {
        const body = await req.json()
        const result = await module.stopAndQuarantineFile(path[1], body.sha1, body.comment)
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // POST /mde/machines/{id}/restrictcodeexecution
      if (method === 'POST' && path.length === 3 && path[2] === 'restrictcodeexecution') {
        const body = await req.json()
        const result = await module.restrictAppExecution(path[1], body.comment)
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // POST /mde/machines/{id}/unrestrictcodeexecution
      if (method === 'POST' && path.length === 3 && path[2] === 'unrestrictcodeexecution') {
        const body = await req.json()
        const result = await module.unrestrictAppExecution(path[1], body.comment)
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // POST /mde/machines/{id}/collectinvestigationpackage
      if (method === 'POST' && path.length === 3 && path[2] === 'collectinvestigationpackage') {
        const body = await req.json()
        const result = await module.collectInvestigationPackage(path[1], body.comment)
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // GET /mde/machines/{id}/actions - List machine actions
      if (method === 'GET' && path.length === 3 && path[2] === 'actions') {
        const actions = await module.listMachineActions(path[1])
        return new Response(
          JSON.stringify(actions),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // ==================== Alert Endpoints ====================

    if (path[0] === 'alerts') {
      // GET /mde/alerts - List alerts
      if (method === 'GET' && path.length === 1) {
        const filter = url.searchParams.get('filter') || undefined
        const top = url.searchParams.get('top') ? parseInt(url.searchParams.get('top')!) : undefined
        const orderBy = url.searchParams.get('orderby') || undefined
        const alerts = await module.listAlerts(filter, top, orderBy)
        return new Response(
          JSON.stringify(alerts),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // GET /mde/alerts/{id} - Get alert
      if (method === 'GET' && path.length === 2) {
        const alert = await module.getAlert(path[1])
        return new Response(
          JSON.stringify(alert),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // PATCH /mde/alerts/{id} - Update alert
      if (method === 'PATCH' && path.length === 2) {
        const body = await req.json()
        const result = await module.updateAlert(
          path[1],
          body.status,
          body.assignedTo,
          body.classification,
          body.determination,
          body.comment
        )
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // ==================== Advanced Hunting ====================

    if (path[0] === 'advancedhunting') {
      // POST /mde/advancedhunting - Run query
      if (method === 'POST' && path.length === 1) {
        const body = await req.json()
        const results = await module.advancedHunting(body.query)
        return new Response(
          JSON.stringify(results),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // ==================== Files ====================

    if (path[0] === 'files') {
      // GET /mde/files/{sha1} - Get file info
      if (method === 'GET' && path.length === 2) {
        const fileInfo = await module.getFileInfo(path[1])
        return new Response(
          JSON.stringify(fileInfo),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // ==================== Indicators ====================

    if (path[0] === 'indicators') {
      // POST /mde/indicators - Add indicator
      if (method === 'POST' && path.length === 1) {
        const body = await req.json()
        const result = await module.addIndicator(
          body.indicatorValue,
          body.indicatorType,
          body.action,
          body.title,
          body.description,
          body.severity,
          body.expirationTime
        )
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // ==================== Machine Actions ====================

    if (path[0] === 'machineactions') {
      // GET /mde/machineactions - List all actions
      if (method === 'GET' && path.length === 1) {
        const actions = await module.listMachineActions()
        return new Response(
          JSON.stringify(actions),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // GET /mde/machineactions/{id} - Get action status
      if (method === 'GET' && path.length === 2) {
        const action = await module.getMachineAction(path[1])
        return new Response(
          JSON.stringify(action),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
    )

  } catch (error) {
    console.error('MDE function error:', error)
    return new Response(
      JSON.stringify({ error: error.message, details: error.toString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

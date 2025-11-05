# SOC Dashboard v2.0 - TypeScript + Self-Hosted Supabase

A fully modular, extensible Security Operations Center (SOC) dashboard built with **Next.js 14 + TypeScript** frontend and **self-hosted Supabase** backend. Features modular plugin architecture with **Supabase Edge Functions** for security tool integrations.

## 🎯 What's New in v2.0

### **Complete Stack Rewrite**
- ✅ **Next.js 14 + TypeScript**: Type-safe, modern React framework
- ✅ **Self-Hosted Supabase**: Full control over your data
- ✅ **Edge Functions (Deno)**: Modular integrations in TypeScript
- ✅ **PostgreSQL**: Powerful database with real-time capabilities
- ✅ **Built-in Auth**: Supabase authentication out of the box
- ✅ **Real-time Updates**: Live data sync across clients
- ✅ **Row Level Security**: Fine-grained access control

### **Modular Architecture Maintained**
- 🔌 Same easy plugin system, now in TypeScript
- 🐝 TheHive integration (Edge Function)
- 🦎 LimaCharlie integration (Edge Function)
- 🔍 Threat Intel modules ready to add

## 📦 Architecture

```
soc_dashboard/
├── app/                          # Next.js 14 App Router
│   ├── api/                      # Next.js API Routes
│   │   ├── health/              # Health check endpoint
│   │   └── modules/             # Module management
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Dashboard page
│   └── globals.css              # Global styles
│
├── components/                   # React Components
│   ├── Dashboard.tsx            # Main dashboard
│   └── Sidebar.tsx              # Navigation sidebar
│
├── supabase/                     # Supabase Configuration
│   ├── functions/               # Edge Functions (Deno/TypeScript)
│   │   ├── _shared/             # Shared utilities
│   │   │   ├── base-module.ts  # Base module interface
│   │   │   └── cors.ts         # CORS headers
│   │   ├── thehive/            # TheHive module
│   │   │   ├── index.ts        # Function entry point
│   │   │   └── module.ts       # Module implementation
│   │   └── limacharlie/        # LimaCharlie module
│   │       ├── index.ts        # Function entry point
│   │       └── module.ts       # Module implementation
│   └── migrations/              # Database migrations
│       └── 001_initial_schema.sql
│
├── docker-compose.supabase.yml  # Self-hosted Supabase stack
├── Dockerfile                    # Next.js production image
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript configuration
└── tailwind.config.js            # Tailwind CSS configuration
```

## 🚀 Quick Start

### Prerequisites

```bash
# Required
- Docker & Docker Compose
- Node.js 18+
- npm or yarn

# Optional (for development)
- Supabase CLI
```

### 1. Clone Repository

```bash
git clone https://github.com/storsteinbono/soc_dashboard.git
cd soc_dashboard
git checkout claude/soc-dashboard-modular-011CUph65Q6LkhSeizFFpV96
```

### 2. Configure Environment

```bash
# Copy Supabase environment file
cp .env.supabase.example .env

# Edit .env and set:
# - POSTGRES_PASSWORD (use a strong password)
# - JWT_SECRET (generate with: openssl rand -base64 32)
# - Module API keys (TheHive, LimaCharlie, etc.)
```

### 3. Start Self-Hosted Supabase

```bash
# Start all Supabase services
docker-compose -f docker-compose.supabase.yml up -d

# Wait for services to be healthy (takes ~30 seconds)
docker-compose -f docker-compose.supabase.yml ps
```

**Services started:**
- 🗄️ PostgreSQL: `localhost:5432`
- 🌐 API Gateway (Kong): `localhost:8000`
- 🎨 Supabase Studio: `localhost:3001`
- ⚡ Edge Functions: Available via Kong
- 🔐 Auth Service: Integrated
- 📡 Realtime: Integrated

### 4. Run Database Migrations

```bash
# The migrations run automatically on first start!
# Check Supabase Studio to verify: http://localhost:3001
```

### 5. Start Next.js Frontend

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

**Open:** http://localhost:3000

## 🏗️ Development Workflow

### Running Locally (Development)

```bash
# Terminal 1: Supabase services
docker-compose -f docker-compose.supabase.yml up

# Terminal 2: Next.js dev server
npm run dev

# Access:
# - Frontend: http://localhost:3000
# - Supabase Studio: http://localhost:3001
# - Supabase API: http://localhost:8000
```

### Testing Edge Functions

```bash
# Test TheHive module
curl http://localhost:8000/functions/v1/thehive/health

# Test LimaCharlie module
curl http://localhost:8000/functions/v1/limacharlie/health

# List sensors
curl http://localhost:8000/functions/v1/limacharlie/sensors
```

### Adding a New Module

**1. Create Edge Function:**

```bash
# Create module directory
mkdir -p supabase/functions/yourmodule

# Create index.ts
cat > supabase/functions/yourmodule/index.ts << 'EOF'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { YourModule } from './module.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const config = {
    api_key: Deno.env.get('YOUR_API_KEY') || '',
  }

  const module = new YourModule(config)
  await module.initialize()

  // Handle requests...
  return new Response(
    JSON.stringify(module.getInfo()),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
EOF
```

**2. Create Module Class:**

```typescript
// supabase/functions/yourmodule/module.ts
import { BaseModule, ModuleInfo, HealthStatus } from '../_shared/base-module.ts'

export class YourModule extends BaseModule {
  async getInfo(): ModuleInfo {
    return {
      name: 'YourModule',
      version: '1.0.0',
      description: 'Your module description',
      author: 'Your Name',
      capabilities: ['threat_intelligence'],
      requires_api_key: true,
      status: this.status,
    }
  }

  async initialize(): Promise<boolean> {
    // Initialize your module
    this.status = 'active'
    this.initialized = true
    return true
  }

  async healthCheck(): Promise<HealthStatus> {
    return {
      status: 'healthy',
      message: 'Module operational',
    }
  }

  getCapabilities() {
    return [
      {
        name: 'feature',
        description: 'Feature description',
        endpoint: '/yourmodule/feature',
        method: 'GET',
      },
    ]
  }
}
```

**3. Add to Database:**

```sql
INSERT INTO modules (name, display_name, description, capabilities, requires_api_key)
VALUES (
  'yourmodule',
  'Your Module',
  'Description of your module',
  '["threat_intelligence"]'::jsonb,
  true
);
```

**4. Add API Key to Environment:**

```bash
# Edit .env
YOUR_MODULE_API_KEY=your-api-key-here
```

**5. Restart Edge Functions:**

```bash
docker-compose -f docker-compose.supabase.yml restart functions
```

That's it! Your module is now integrated.

## 🔧 Configuration

### Environment Variables

**Supabase Core:**
```env
POSTGRES_PASSWORD=your-strong-password
JWT_SECRET=your-jwt-secret
ANON_KEY=your-anon-key
SERVICE_ROLE_KEY=your-service-role-key
```

**Module API Keys:**
```env
THEHIVE_API_URL=http://your-thehive:9000
THEHIVE_API_KEY=your-api-key

LIMACHARLIE_API_KEY=your-api-key
LIMACHARLIE_ORG_ID=your-org-id

VIRUSTOTAL_API_KEY=your-api-key
SHODAN_API_KEY=your-api-key
ABUSEIPDB_API_KEY=your-api-key
URLSCAN_API_KEY=your-api-key
```

### Database Schema

The initial migration creates:
- `modules` - Module registry
- `module_configs` - Module configurations
- `thehive_cases` - TheHive case cache
- `limacharlie_sensors` - LimaCharlie sensor cache
- `detection_events` - Detection events from all sources
- `threat_intel_cache` - Threat intelligence cache

## 🐳 Production Deployment

### Full Stack with Docker Compose

```bash
# 1. Set production environment variables
cp .env.supabase.example .env
# Edit .env with production values

# 2. Build and start all services
docker-compose -f docker-compose.supabase.yml up -d

# 3. Check health
docker-compose -f docker-compose.supabase.yml ps

# 4. View logs
docker-compose -f docker-compose.supabase.yml logs -f
```

### Nginx Reverse Proxy (Optional)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Supabase API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Supabase Studio (optional, for admin access)
    location /studio {
        proxy_pass http://localhost:3001;
    }
}
```

## 📊 Database Management

### Supabase Studio

Access at: **http://localhost:3001**

- Visual table editor
- SQL editor
- Database migrations
- API documentation
- Authentication management

### Direct Database Access

```bash
# Using psql
docker exec -it supabase-db psql -U postgres -d postgres

# Run SQL
\dt  # List tables
SELECT * FROM modules;
```

## 🔒 Security Best Practices

### 1. Strong Passwords
```bash
# Generate secure JWT secret
openssl rand -base64 32

# Generate secure Postgres password
openssl rand -base64 32
```

### 2. Row Level Security (RLS)

Already configured in migrations:
- Service role (Edge Functions) has full access
- Authenticated users have read-only access
- Customize in migrations file

### 3. API Keys

- Never commit `.env` file
- Use environment variables in production
- Rotate keys regularly
- Use different keys for dev/prod

### 4. Network Security

```yaml
# docker-compose.supabase.yml
# Expose only necessary ports:
ports:
  - "3000:3000"  # Frontend only
  # - "3001:3000"  # Comment out Studio in production
  # - "8000:8000"  # Use reverse proxy instead
```

## 🧪 Testing

### Unit Tests (Future)

```bash
# TypeScript tests
npm test

# Edge Function tests
deno test supabase/functions/
```

### Integration Tests

```bash
# Test module health
curl http://localhost:8000/functions/v1/thehive/health
curl http://localhost:8000/functions/v1/limacharlie/health

# Test frontend API
curl http://localhost:3000/api/health
curl http://localhost:3000/api/modules
```

## 📈 Monitoring

### Health Checks

```bash
# System health
curl http://localhost:3000/api/health

# Module health
curl http://localhost:8000/functions/v1/thehive/health
curl http://localhost:8000/functions/v1/limacharlie/health

# Database health
docker exec supabase-db pg_isready -U postgres
```

### Logs

```bash
# All services
docker-compose -f docker-compose.supabase.yml logs -f

# Specific service
docker-compose -f docker-compose.supabase.yml logs -f nextjs
docker-compose -f docker-compose.supabase.yml logs -f functions
docker-compose -f docker-compose.supabase.yml logs -f db
```

## 🔄 Updating

### Update Dependencies

```bash
# Frontend
npm update

# Rebuild Docker images
docker-compose -f docker-compose.supabase.yml build
docker-compose -f docker-compose.supabase.yml up -d
```

### Database Migrations

```bash
# Create new migration
cat > supabase/migrations/002_your_migration.sql << 'EOF'
-- Your SQL here
EOF

# Apply migration
docker-compose -f docker-compose.supabase.yml restart db
```

## 🛠️ Troubleshooting

### Services won't start

```bash
# Check logs
docker-compose -f docker-compose.supabase.yml logs

# Check if ports are available
lsof -i :3000  # Next.js
lsof -i :8000  # Supabase API
lsof -i :5432  # PostgreSQL

# Reset everything
docker-compose -f docker-compose.supabase.yml down -v
docker-compose -f docker-compose.supabase.yml up -d
```

### Edge Functions not working

```bash
# Check function logs
docker-compose -f docker-compose.supabase.yml logs functions

# Verify environment variables
docker exec supabase-edge-functions env | grep API_KEY

# Restart functions
docker-compose -f docker-compose.supabase.yml restart functions
```

### Database issues

```bash
# Check database logs
docker-compose -f docker-compose.supabase.yml logs db

# Access database
docker exec -it supabase-db psql -U postgres -d postgres

# Check migrations
\dt  # List tables
SELECT * FROM modules;  # Verify data
```

## 📚 API Documentation

### Core Endpoints

**Health Check:**
```bash
GET /api/health
# Returns: { status, modules_loaded, modules: {...} }
```

**List Modules:**
```bash
GET /api/modules
# Returns: { total, modules: [...] }
```

### TheHive Module

**List Cases:**
```bash
GET /functions/v1/thehive/cases?limit=10&sort=-startDate
```

**Create Case:**
```bash
POST /functions/v1/thehive/cases
Content-Type: application/json

{
  "title": "Security Incident",
  "description": "Description here",
  "severity": 2,
  "tlp": 2,
  "tags": ["malware", "phishing"]
}
```

### LimaCharlie Module

**List Sensors:**
```bash
GET /functions/v1/limacharlie/sensors
```

**Isolate Sensor:**
```bash
POST /functions/v1/limacharlie/sensors/{sensor_id}/isolate
```

## 🎯 Roadmap

- [ ] Add remaining threat intel modules (VirusTotal, Shodan, etc.)
- [ ] Implement user authentication UI
- [ ] Add real-time dashboard updates
- [ ] Create custom dashboards per user
- [ ] Add playbook automation
- [ ] Implement notification system
- [ ] Add export/reporting features
- [ ] Mobile app (React Native)

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## 📝 License

MIT License

## 🆘 Support

- Documentation: This README
- Issues: GitHub Issues
- Supabase Docs: https://supabase.com/docs

---

**Built with ❤️ for security analysts**

Next.js 14 • TypeScript • Supabase • PostgreSQL • Deno Edge Functions

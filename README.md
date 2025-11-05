# SOC Dashboard - Modular Security Operations Center

A highly modular, extensible Security Operations Center (SOC) dashboard with full API compatibility and plugin-based architecture. Built for security analysts to efficiently manage incidents, monitor endpoints, and analyze threats.

## 🎯 Features

- **🔌 Fully Modular Architecture**: Easy plugin system for adding new tools
- **🐝 TheHive Integration**: Complete incident management and case handling
- **🦎 LimaCharlie Integration**: Full EDR capabilities with sensor management
- **🔍 Threat Intelligence**: Multiple intelligence sources (VirusTotal, Shodan, AbuseIPDB, URLScan.io)
- **🌐 Modern Web Interface**: Real-time React dashboard with beautiful UI
- **🚀 RESTful API**: All functionality accessible via comprehensive API
- **📊 Real-time Monitoring**: System health and module status tracking
- **🛡️ Production Ready**: Built with FastAPI and React for scalability

## 🏗️ Architecture

```
soc_dashboard/
├── backend/                  # Python FastAPI Backend
│   ├── main.py              # Main application entry point
│   ├── config.yaml          # Module configurations
│   ├── requirements.txt     # Python dependencies
│   ├── core/                # Core functionality
│   │   ├── base_module.py   # Base module interface
│   │   ├── module_loader.py # Dynamic module loader
│   │   └── config.py        # Configuration management
│   ├── api/                 # API routes
│   │   ├── health.py        # Health check endpoints
│   │   └── modules.py       # Module management endpoints
│   └── modules/             # Plugin modules
│       ├── thehive/         # TheHive integration
│       ├── limacharlie/     # LimaCharlie integration
│       ├── virustotal/      # VirusTotal integration
│       ├── shodan/          # Shodan integration
│       ├── abuseipdb/       # AbuseIPDB integration
│       └── urlscan/         # URLScan.io integration
│
└── frontend/                # React Frontend
    ├── package.json
    ├── public/
    └── src/
        ├── App.js           # Main application
        ├── components/      # React components
        │   ├── Dashboard.js
        │   ├── TheHive.js
        │   ├── LimaCharlie.js
        │   ├── ThreatIntelligence.js
        │   └── ModuleStatus.js
        └── App.css          # Styling
```

## 📦 Integrated Modules

### 1. **TheHive** - Incident Management
- ✅ Create, update, and manage cases
- ✅ Alert handling and promotion
- ✅ Observable management
- ✅ Task tracking
- ✅ Case search and filtering

### 2. **LimaCharlie** - EDR & Response
- ✅ Sensor management
- ✅ Network isolation/rejoining
- ✅ Telemetry querying
- ✅ Detection management
- ✅ IOC scanning
- ✅ Remote command execution
- ✅ Process management

### 3. **VirusTotal** - Threat Intelligence
- ✅ File hash analysis
- ✅ URL scanning
- ✅ IP reputation
- ✅ Domain analysis
- ✅ Intelligence search

### 4. **Shodan** - Internet Scanning
- ✅ Host lookups
- ✅ Service discovery
- ✅ DNS resolution
- ✅ Exploit search

### 5. **AbuseIPDB** - IP Reputation
- ✅ IP abuse checking
- ✅ Blacklist retrieval
- ✅ Report malicious IPs

### 6. **URLScan.io** - URL Analysis
- ✅ URL submission and scanning
- ✅ Result retrieval
- ✅ Historical search

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Node.js 16+
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Install Python dependencies:**
```bash
pip install -r requirements.txt
```

3. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Configure modules:**
Edit `config.yaml` with your API keys:
```yaml
modules:
  thehive:
    enabled: true
    api_url: "http://localhost:9000"
    api_key: "YOUR_THEHIVE_API_KEY"

  limacharlie:
    enabled: true
    api_key: "YOUR_LIMACHARLIE_API_KEY"
    organization_id: "YOUR_ORG_ID"

  virustotal:
    enabled: true
    api_key: "YOUR_VIRUSTOTAL_API_KEY"

  # ... other modules
```

5. **Run the backend:**
```bash
python main.py
```

The API will be available at `http://localhost:8000`
API documentation at `http://localhost:8000/docs`

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start development server:**
```bash
npm start
```

The dashboard will open at `http://localhost:3000`

## 📖 API Documentation

### Core Endpoints

#### Health Check
```
GET /api/v1/health
```
Returns overall system health and module status.

#### List Modules
```
GET /api/v1/modules
```
Lists all loaded modules with their information.

#### Module Details
```
GET /api/v1/modules/{module_name}
```
Get detailed information about a specific module.

### TheHive Endpoints

#### Cases
```
GET    /api/v1/thehive/cases           # List cases
GET    /api/v1/thehive/cases/{id}      # Get case
POST   /api/v1/thehive/cases           # Create case
PUT    /api/v1/thehive/cases/{id}      # Update case
POST   /api/v1/thehive/cases/{id}/close # Close case
```

#### Alerts
```
GET    /api/v1/thehive/alerts                # List alerts
POST   /api/v1/thehive/alerts/{id}/promote   # Promote to case
```

#### Observables & Tasks
```
POST   /api/v1/thehive/cases/{id}/observables # Add observable
POST   /api/v1/thehive/cases/{id}/tasks       # Create task
```

### LimaCharlie Endpoints

#### Sensors
```
GET    /api/v1/limacharlie/sensors           # List sensors
GET    /api/v1/limacharlie/sensors/{id}      # Get sensor
POST   /api/v1/limacharlie/sensors/{id}/isolate  # Isolate
POST   /api/v1/limacharlie/sensors/{id}/rejoin   # Rejoin
```

#### Telemetry & Detection
```
POST   /api/v1/limacharlie/events/query      # Query events
GET    /api/v1/limacharlie/detections        # List detections
POST   /api/v1/limacharlie/ioc/scan          # Scan IOC
```

#### Remote Operations
```
POST   /api/v1/limacharlie/sensors/{id}/command     # Execute command
GET    /api/v1/limacharlie/sensors/{id}/processes   # List processes
POST   /api/v1/limacharlie/sensors/{id}/processes/{pid}/kill # Kill process
```

### Threat Intelligence Endpoints

#### VirusTotal
```
GET    /api/v1/virustotal/files/{hash}       # Analyze hash
POST   /api/v1/virustotal/urls               # Scan URL
GET    /api/v1/virustotal/ip/{ip}            # Analyze IP
GET    /api/v1/virustotal/domains/{domain}   # Analyze domain
POST   /api/v1/virustotal/search             # Search intelligence
```

## 🔧 Adding New Modules

The SOC Dashboard is designed to be highly extensible. Here's how to add a new module:

### 1. Create Module Directory
```bash
mkdir backend/modules/your_module
touch backend/modules/your_module/__init__.py
touch backend/modules/your_module/module.py
touch backend/modules/your_module/routes.py
```

### 2. Implement Module Class
Create `module.py` inheriting from `BaseModule`:

```python
from core.base_module import BaseModule, ModuleInfo, ModuleStatus, ModuleCapability

class YourModuleModule(BaseModule):
    async def get_info(self) -> ModuleInfo:
        return ModuleInfo(
            name="Your Module",
            version="1.0.0",
            description="Module description",
            author="Your Name",
            capabilities=[ModuleCapability.THREAT_INTELLIGENCE],
            requires_api_key=True,
            status=self.status
        )

    async def initialize(self) -> bool:
        # Initialize your module
        self.status = ModuleStatus.ACTIVE
        self._initialized = True
        return True

    async def health_check(self) -> Dict[str, Any]:
        return {"status": "healthy"}

    async def get_capabilities(self) -> List[Dict[str, Any]]:
        return [{"name": "feature", "endpoint": "/api/v1/yourmodule/feature"}]
```

### 3. Create API Routes
Create `routes.py`:

```python
from fastapi import APIRouter, Request

router = APIRouter()

@router.get("/feature")
async def feature(request: Request):
    module = request.app.state.module_loader.get_module('your_module')
    # Use module functionality
    return {"result": "data"}
```

### 4. Register Module
Add to `config.yaml`:
```yaml
modules:
  your_module:
    enabled: true
    api_key: "YOUR_API_KEY"
```

Import and register in `main.py`:
```python
from modules.your_module.routes import router as yourmodule_router
app.include_router(yourmodule_router, prefix=f"{settings.api_prefix}/yourmodule")
```

That's it! Your module will be automatically loaded and available.

## 🔒 Security Considerations

1. **API Keys**: Never commit API keys. Use environment variables or `config.yaml` (add to `.gitignore`)
2. **Authentication**: Implement authentication middleware for production use
3. **HTTPS**: Always use HTTPS in production
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **Input Validation**: All inputs are validated using Pydantic models

## 🐳 Docker Deployment

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DEBUG=false
    volumes:
      - ./backend/config.yaml:/app/config.yaml

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
```

Run:
```bash
docker-compose up -d
```

## 📊 Monitoring

The dashboard provides real-time monitoring of:
- Module health status
- API connectivity
- Active sensors/cases
- Detection events
- System performance

Access monitoring at: `http://localhost:3000/status`

## 🤝 Contributing

Contributions are welcome! To add new modules or features:

1. Fork the repository
2. Create your feature branch
3. Follow the module creation guide above
4. Test your changes
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Check the API documentation at `/docs`
- Review module-specific configuration in `config.yaml`
- Ensure all API keys are properly configured
- Check logs for error messages

## 🎯 Roadmap

- [ ] MISP integration
- [ ] Cortex analyzers support
- [ ] Elasticsearch/SIEM integration
- [ ] Automated playbooks
- [ ] Mobile responsive improvements
- [ ] Dark/light theme toggle
- [ ] Multi-tenancy support
- [ ] Advanced analytics and reporting

---

Built with ❤️ for security analysts by security analysts
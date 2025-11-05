# SOC Dashboard - Testing Guide

## ✅ Code Status

All code has been successfully pushed to:
- **Branch**: `claude/soc-dashboard-modular-011CUph65Q6LkhSeizFFpV96`
- **Repository**: `storsteinbono/soc_dashboard`

## 🧪 Testing Overview

This guide will walk you through testing the SOC Dashboard from basic setup to advanced features.

---

## 📋 Prerequisites

Before testing, ensure you have:

```bash
# Check Python version (3.9+)
python --version

# Check Node.js version (16+)
node --version

# Check npm
npm --version

# Check Docker (optional)
docker --version
```

---

## 🚀 Quick Test (Without API Keys)

You can test the basic functionality without any API keys to verify the system works.

### 1. Clone the Repository

```bash
git clone https://github.com/storsteinbono/soc_dashboard.git
cd soc_dashboard
git checkout claude/soc-dashboard-modular-011CUph65Q6LkhSeizFFpV96
```

### 2. Test Backend (Basic Mode)

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy config file (modules will show as inactive without API keys)
cp .env.example .env

# Start the backend
python main.py
```

**Expected Output:**
```
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Starting SOC Dashboard...
INFO:     Loaded configurations for X modules
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**✅ Test Points:**
- [ ] Backend starts without errors
- [ ] No crashes on startup
- [ ] Server responds on port 8000

### 3. Test API Documentation

Open your browser:
```
http://localhost:8000/docs
```

**✅ Test Points:**
- [ ] Swagger UI loads
- [ ] You see all API endpoints listed
- [ ] Endpoints are organized by tags (Health, Modules, TheHive, LimaCharlie, etc.)

### 4. Test Health Endpoint

**In Browser:** http://localhost:8000/api/v1/health

**Or with curl:**
```bash
curl http://localhost:8000/api/v1/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "modules_loaded": 0,
  "modules": {}
}
```

**✅ Test Points:**
- [ ] Returns 200 status code
- [ ] JSON response is valid
- [ ] Shows system is healthy

### 5. Test Modules Endpoint

```bash
curl http://localhost:8000/api/v1/modules
```

**Expected Response:**
```json
{
  "total": 0,
  "modules": []
}
```

**✅ Test Points:**
- [ ] Returns module list (empty if no API keys)
- [ ] No server errors

### 6. Test Frontend

**In a new terminal:**
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

**Expected:**
- Browser opens automatically to http://localhost:3000
- Dashboard loads with sidebar navigation
- Shows 0 modules loaded (since no API keys configured)

**✅ Test Points:**
- [ ] Frontend loads without errors
- [ ] Navigation sidebar appears
- [ ] Dashboard shows module cards
- [ ] System Status shows "healthy"
- [ ] No console errors in browser DevTools

---

## 🔑 Testing With API Keys

To test full functionality, you need API keys for at least one module.

### Option 1: Test with VirusTotal (Easiest - Free API)

1. **Get Free VirusTotal API Key:**
   - Sign up at https://www.virustotal.com/
   - Go to your profile → API Key
   - Copy your API key

2. **Configure Backend:**

Edit `backend/config.yaml`:
```yaml
modules:
  virustotal:
    enabled: true
    api_key: "YOUR_VIRUSTOTAL_API_KEY_HERE"
    timeout: 30
```

3. **Restart Backend:**
```bash
# In backend terminal, press Ctrl+C, then:
python main.py
```

4. **Test VirusTotal Module:**

**Check module loaded:**
```bash
curl http://localhost:8000/api/v1/modules
```

You should now see VirusTotal in the list with `"status": "active"`

**Test file hash lookup:**
```bash
curl "http://localhost:8000/api/v1/virustotal/files/44d88612fea8a8f36de82e1278abb02f"
```

**✅ Test Points:**
- [ ] Module appears in module list
- [ ] Status is "active"
- [ ] Health check shows "healthy"
- [ ] Can query file hashes
- [ ] Frontend shows module as active

### Option 2: Test with AbuseIPDB (Free API)

1. **Get Free AbuseIPDB API Key:**
   - Sign up at https://www.abuseipdb.com/
   - Go to Account → API
   - Copy API key

2. **Configure:**
```yaml
modules:
  abuseipdb:
    enabled: true
    api_key: "YOUR_ABUSEIPDB_API_KEY_HERE"
    timeout: 30
```

3. **Test IP Lookup:**
```bash
curl "http://localhost:8000/api/v1/abuseipdb/check/8.8.8.8"
```

### Option 3: Test with URLScan.io (Free API)

1. **Get API Key:**
   - Sign up at https://urlscan.io/
   - Get API key from account settings

2. **Configure:**
```yaml
modules:
  urlscan:
    enabled: true
    api_key: "YOUR_URLSCAN_API_KEY_HERE"
    timeout: 30
```

3. **Test URL Scan:**
```bash
curl -X POST "http://localhost:8000/api/v1/urlscan/scan" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.google.com"}'
```

---

## 🐝 Testing TheHive Integration

If you have TheHive instance:

1. **Configure:**
```yaml
modules:
  thehive:
    enabled: true
    api_url: "http://your-thehive-server:9000"
    api_key: "YOUR_THEHIVE_API_KEY"
    verify_ssl: true
    timeout: 30
```

2. **Test Cases API:**
```bash
# List cases
curl http://localhost:8000/api/v1/thehive/cases

# Create a test case
curl -X POST http://localhost:8000/api/v1/thehive/cases \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Case from SOC Dashboard",
    "description": "Testing the integration",
    "severity": 2,
    "tlp": 2,
    "tags": ["test"]
  }'
```

3. **Test in Frontend:**
   - Navigate to "TheHive" in sidebar
   - Should see your cases listed
   - Can interact with cases

---

## 🦎 Testing LimaCharlie Integration

If you have LimaCharlie account:

1. **Configure:**
```yaml
modules:
  limacharlie:
    enabled: true
    api_key: "YOUR_LIMACHARLIE_API_KEY"
    organization_id: "YOUR_ORG_ID"
    timeout: 30
```

2. **Test Sensors API:**
```bash
# List sensors
curl http://localhost:8000/api/v1/limacharlie/sensors

# Get detections
curl http://localhost:8000/api/v1/limacharlie/detections
```

3. **Test in Frontend:**
   - Navigate to "LimaCharlie" in sidebar
   - Should see your sensors
   - Can view detections

---

## 🐳 Testing with Docker

### Quick Docker Test

1. **Ensure config.yaml has your API keys**

2. **Build and run:**
```bash
docker-compose up -d
```

3. **Check logs:**
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

4. **Test:**
- Frontend: http://localhost:80
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

5. **Stop:**
```bash
docker-compose down
```

---

## 🧪 Comprehensive Test Scenarios

### Scenario 1: Basic Health Check Workflow

```bash
# 1. Check system health
curl http://localhost:8000/api/v1/health

# 2. List all modules
curl http://localhost:8000/api/v1/modules

# 3. Get specific module info (if loaded)
curl http://localhost:8000/api/v1/modules/virustotal

# 4. Check module capabilities
curl http://localhost:8000/api/v1/modules/virustotal/capabilities
```

### Scenario 2: Threat Intelligence Workflow

```bash
# 1. Check file hash
curl "http://localhost:8000/api/v1/virustotal/files/44d88612fea8a8f36de82e1278abb02f"

# 2. Check IP reputation
curl "http://localhost:8000/api/v1/abuseipdb/check/1.2.3.4"

# 3. Scan URL
curl -X POST "http://localhost:8000/api/v1/urlscan/scan" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### Scenario 3: Frontend Navigation Test

1. Open http://localhost:3000
2. Click through each menu item:
   - Dashboard → should show overview
   - System Status → should show module health
   - TheHive → should show cases (or config message)
   - LimaCharlie → should show sensors (or config message)
   - Threat Intelligence → should show search form

### Scenario 4: Error Handling Test

```bash
# Test invalid hash
curl "http://localhost:8000/api/v1/virustotal/files/invalid"

# Test non-existent endpoint
curl http://localhost:8000/api/v1/nonexistent

# Test invalid JSON
curl -X POST "http://localhost:8000/api/v1/thehive/cases" \
  -H "Content-Type: application/json" \
  -d 'invalid json'
```

**✅ Expected:**
- Proper error messages returned
- No server crashes
- 404 for missing endpoints
- 400 for bad requests
- 422 for validation errors

---

## 🔍 Debugging Tips

### Backend Not Starting?

```bash
# Check Python version
python --version  # Should be 3.9+

# Check if port 8000 is in use
lsof -i :8000  # Linux/Mac
netstat -ano | findstr :8000  # Windows

# Check logs
python main.py  # Look for error messages
```

### Frontend Not Loading?

```bash
# Check Node version
node --version  # Should be 16+

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check if port 3000 is in use
lsof -i :3000  # Linux/Mac
netstat -ano | findstr :3000  # Windows
```

### Module Not Loading?

1. Check config.yaml syntax (valid YAML)
2. Verify API key is correct
3. Check backend logs for errors
4. Test API key manually with curl/Postman
5. Check `enabled: true` in config

### API Requests Failing?

```bash
# Test with verbose curl
curl -v http://localhost:8000/api/v1/health

# Check CORS if from browser
# Should allow localhost:3000 by default

# Check backend logs
# Look for error messages when request is made
```

---

## ✅ Test Checklist

### Basic Functionality
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] API documentation loads (/docs)
- [ ] Health endpoint returns 200
- [ ] Modules endpoint returns data
- [ ] Frontend dashboard loads
- [ ] Navigation works

### Module Loading
- [ ] Modules listed in config.yaml are loaded
- [ ] Module status shows "active" when API key is valid
- [ ] Module status shows "error" when API key is invalid
- [ ] Health check reports module status
- [ ] Capabilities endpoint lists features

### API Functionality
- [ ] GET requests work
- [ ] POST requests work
- [ ] PUT requests work (if implemented)
- [ ] Error handling is graceful
- [ ] Response format is JSON
- [ ] Status codes are correct

### Frontend Functionality
- [ ] Dashboard shows module count
- [ ] Module cards display correctly
- [ ] Navigation sidebar works
- [ ] Module-specific pages load
- [ ] Real-time health updates work
- [ ] No console errors

### Integration Tests (if you have API keys)
- [ ] VirusTotal hash lookup works
- [ ] TheHive case listing works
- [ ] LimaCharlie sensor listing works
- [ ] AbuseIPDB IP check works
- [ ] URLScan URL submission works

---

## 📊 Expected Test Results Summary

| Component | Without API Keys | With API Keys |
|-----------|-----------------|---------------|
| Backend Startup | ✅ Works | ✅ Works |
| Frontend Startup | ✅ Works | ✅ Works |
| Health Endpoint | ✅ Returns healthy | ✅ Returns healthy |
| Module Loading | ⚠️ 0 modules active | ✅ Configured modules active |
| API Calls | ❌ 404 (no modules) | ✅ Returns data |
| Frontend Display | ⚠️ Shows 0 modules | ✅ Shows active modules |

---

## 🎯 Quick Success Test

Run this complete test sequence:

```bash
# 1. Start backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py &
BACKEND_PID=$!

# 2. Wait for backend to start
sleep 5

# 3. Test health
curl http://localhost:8000/api/v1/health

# 4. Test docs
curl http://localhost:8000/docs

# 5. In another terminal, start frontend
cd frontend
npm install
npm start

# Frontend will open in browser
# Navigate through the dashboard

# When done:
kill $BACKEND_PID
```

**If all steps complete without errors, your SOC Dashboard is working! ✅**

---

## 🆘 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Port 8000 already in use | Kill process: `kill $(lsof -ti:8000)` |
| Module won't load | Check API key validity and config.yaml syntax |
| CORS errors | Verify backend CORS settings include frontend URL |
| Import errors | Ensure virtual environment is activated |
| Frontend won't build | Delete node_modules, run `npm install` again |
| Docker won't start | Ensure Docker daemon is running |

---

## 📞 Getting Help

If you encounter issues:

1. Check this guide first
2. Review logs for error messages
3. Verify all prerequisites are installed
4. Check GitHub issues
5. Review API documentation at /docs

---

## 🎉 Success Criteria

Your SOC Dashboard is working correctly if:

✅ Backend starts and responds on port 8000
✅ Frontend loads on port 3000
✅ API documentation is accessible
✅ Health check returns "healthy"
✅ At least one module loads successfully
✅ No critical errors in logs
✅ Navigation works in frontend
✅ API calls return expected data

**Once you see these, you're ready to use your SOC Dashboard! 🛡️**

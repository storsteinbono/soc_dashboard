# Microsoft Defender for Endpoint (MDE) Module

Complete integration for Microsoft Defender for Endpoint with Azure AD authentication, machine isolation, AV scanning, alert management, and advanced hunting capabilities.

## 🎯 Features

### ✅ **Machine Management**
- List all machines in organization
- Get detailed machine information
- View logged-on users
- Track machine health and risk scores
- Monitor exposure levels

### 🔒 **Isolation & Response**
- **Isolate machines** from network (Full or Selective)
- **Unisolate machines** to restore connectivity
- **Run AV scans** (Quick or Full)
- **Stop and quarantine files** by SHA1
- **Restrict code execution** on machines
- **Remove execution restrictions**
- **Collect investigation packages** for forensics

### 🚨 **Alert Management**
- List security alerts with filtering
- Get detailed alert information
- Update alert status (New, InProgress, Resolved)
- Assign alerts to analysts
- Classify alerts (TruePositive, FalsePositive, Informational)
- Add comments to alerts

### 🔍 **Threat Hunting**
- **Advanced Hunting** with Kusto Query Language (KQL)
- Save and manage hunting queries
- Track query execution history

### 📁 **File Analysis**
- Get file information by SHA1
- Add threat indicators (IoCs)
- Manage indicator lifecycle

### 📊 **Action Tracking**
- Monitor response action status
- View action history per machine
- Track pending, in-progress, and completed actions

## 🔐 Azure AD Setup

### Prerequisites

- Azure AD tenant with Microsoft 365 E5 or Microsoft Defender for Endpoint license
- Global Administrator or Security Administrator role
- Access to Azure Portal

### Step 1: Register Application

1. Go to [Azure Portal → App Registrations](https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps)
2. Click **"New registration"**
3. Name: `SOC Dashboard MDE Integration`
4. Supported account types: **"Accounts in this organizational directory only"**
5. Click **"Register"**

### Step 2: Get Credentials

After registration, note down:
- **Application (client) ID**: Found on the Overview page
- **Directory (tenant) ID**: Found on the Overview page

### Step 3: Create Client Secret

1. In your app registration, go to **"Certificates & secrets"**
2. Click **"New client secret"**
3. Description: `SOC Dashboard Secret`
4. Expires: Choose duration (recommended: 24 months)
5. Click **"Add"**
6. **IMPORTANT**: Copy the secret **VALUE** immediately (you won't see it again!)

### Step 4: Configure API Permissions

1. Go to **"API permissions"**
2. Click **"Add a permission"**
3. Select **"APIs my organization uses"**
4. Search for: **"WindowsDefenderATP"** or **"Microsoft Threat Protection"**
5. Select **"Application permissions"** (NOT Delegated)
6. Add these permissions:

#### **Required Permissions:**

| Permission | Description |
|------------|-------------|
| **Machine.Read.All** | Read all machine profiles |
| **Machine.Isolate** | Isolate/unisolate machines |
| **Machine.RestrictExecution** | Restrict/unrestrict app execution |
| **Machine.Scan** | Run antivirus scans |
| **Machine.StopAndQuarantine** | Stop and quarantine files |
| **Machine.CollectForensics** | Collect investigation packages |
| **Alert.Read.All** | Read all alerts |
| **Alert.ReadWrite.All** | Read and update alerts |
| **AdvancedQuery.Read.All** | Run advanced hunting queries |
| **File.Read.All** | Read file information |
| **Ti.ReadWrite.All** | Manage threat indicators |

7. Click **"Grant admin consent for [Your Organization]"**
   - **CRITICAL**: You must have admin privileges to grant consent
   - All permissions should show a green checkmark after consent

### Step 5: Verify Permissions

Ensure all permissions show:
- ✅ Green checkmark in "Status" column
- "Granted for [Your Organization]" in "Admin consent required" column

## 🚀 Configuration

### Method 1: Environment Variables (Production)

Add to `.env` file:

```bash
# Microsoft Defender for Endpoint
MDE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MDE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MDE_CLIENT_SECRET=your-secret-value-here
```

Restart Edge Functions:
```bash
docker-compose -f docker-compose.supabase.yml restart functions
```

### Method 2: Web UI (Development)

1. Navigate to **http://localhost:3000/mde/settings**
2. Enter your credentials:
   - Tenant ID
   - Client ID
   - Client Secret
3. Click **"Test Connection"** to verify
4. Click **"Save Configuration"**

## 📡 API Endpoints

All endpoints are prefixed with `/functions/v1/mde` (Edge Function) or `/api/mde` (Next.js proxy).

### Machine Endpoints

#### List Machines
```http
GET /mde/machines?filter={filter}&top={limit}
```

**Query Parameters:**
- `filter`: OData filter (e.g., `healthStatus eq 'Active'`)
- `top`: Limit results (default: 20)

**Example:**
```bash
curl "http://localhost:8000/functions/v1/mde/machines?top=10"
```

#### Get Machine
```http
GET /mde/machines/{machine_id}
```

#### Isolate Machine
```http
POST /mde/machines/{machine_id}/isolate
Content-Type: application/json

{
  "isolationType": "Full",  // or "Selective"
  "comment": "Isolated due to ransomware detection"
}
```

**Isolation Types:**
- **Full**: Complete network isolation (only MDE communication allowed)
- **Selective**: Allows Outlook, Teams, Skype

#### Unisolate Machine
```http
POST /mde/machines/{machine_id}/unisolate
Content-Type: application/json

{
  "comment": "Threat remediated, restoring connectivity"
}
```

#### Run AV Scan
```http
POST /mde/machines/{machine_id}/scan
Content-Type: application/json

{
  "scanType": "Quick",  // or "Full"
  "comment": "Scheduled security scan"
}
```

**Scan Types:**
- **Quick**: Fast scan of common locations (~15 minutes)
- **Full**: Complete system scan (can take hours)

#### Stop and Quarantine File
```http
POST /mde/machines/{machine_id}/stopandquarantinefile
Content-Type: application/json

{
  "sha1": "88c99a84f0e8a8f0...",
  "comment": "Malicious file detected"
}
```

#### Restrict Code Execution
```http
POST /mde/machines/{machine_id}/restrictcodeexecution
Content-Type: application/json

{
  "comment": "Restricting execution during investigation"
}
```

#### Collect Investigation Package
```http
POST /mde/machines/{machine_id}/collectinvestigationpackage
Content-Type: application/json

{
  "comment": "Collecting forensic data for incident #12345"
}
```

### Alert Endpoints

#### List Alerts
```http
GET /mde/alerts?filter={filter}&top={limit}&orderby={field}
```

**Example Filters:**
```bash
# High severity unresolved alerts
filter=severity eq 'High' and status ne 'Resolved'

# Alerts from last 24 hours
filter=createdDateTime gt 2024-01-01T00:00:00Z

# Alerts for specific machine
filter=machineId eq 'abc123...'
```

#### Update Alert
```http
PATCH /mde/alerts/{alert_id}
Content-Type: application/json

{
  "status": "InProgress",
  "assignedTo": "analyst@company.com",
  "classification": "TruePositive",
  "determination": "Malware",
  "comment": "Investigating ransomware incident"
}
```

**Status Values:**
- `New`: Unassigned alert
- `InProgress`: Under investigation
- `Resolved`: Investigation complete

**Classification:**
- `TruePositive`: Confirmed threat
- `FalsePositive`: Benign detection
- `Informational`: No action needed

### Advanced Hunting

#### Run Query
```http
POST /mde/advancedhunting
Content-Type: application/json

{
  "query": "DeviceProcessEvents | where Timestamp > ago(1d) | where FileName == 'powershell.exe' | take 100"
}
```

**Example Queries:**

**Find PowerShell with suspicious parameters:**
```kusto
DeviceProcessEvents
| where Timestamp > ago(7d)
| where FileName =~ "powershell.exe"
| where ProcessCommandLine contains "-enc" or ProcessCommandLine contains "-w hidden"
| project Timestamp, DeviceName, AccountName, ProcessCommandLine
| limit 100
```

**Detect potential lateral movement:**
```kusto
DeviceNetworkEvents
| where Timestamp > ago(1h)
| where RemotePort in (445, 139, 3389)
| summarize ConnectionCount = count() by DeviceName, RemoteIP
| where ConnectionCount > 10
```

**Find file executions from temp directories:**
```kusto
DeviceProcessEvents
| where Timestamp > ago(24h)
| where FolderPath contains "\\temp\\" or FolderPath contains "\\AppData\\Local\\Temp"
| project Timestamp, DeviceName, FileName, FolderPath, SHA1
```

### Indicators (IoCs)

#### Add Indicator
```http
POST /mde/indicators
Content-Type: application/json

{
  "indicatorValue": "88c99a84f0e8a8f0...",
  "indicatorType": "FileSha1",
  "action": "AlertAndBlock",
  "title": "Known ransomware hash",
  "description": "Detected in incident #12345",
  "severity": "High",
  "expirationTime": "2025-12-31T23:59:59Z"
}
```

**Indicator Types:**
- `FileSha1`, `FileSha256`: File hashes
- `IpAddress`: IPv4/IPv6 addresses
- `DomainName`: Domain names
- `Url`: Full URLs

**Actions:**
- `Alert`: Generate alert only
- `AlertAndBlock`: Alert and block
- `Allowed`: Whitelist indicator

## 💻 Usage Examples

### TypeScript/JavaScript

```typescript
// Isolate compromised machine
async function isolateMachine(machineId: string) {
  const response = await fetch(`/api/mde/machines/${machineId}/isolate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      isolationType: 'Full',
      comment: 'Ransomware detected - isolating immediately'
    })
  })

  const result = await response.json()
  console.log('Action ID:', result.id)
  return result
}

// Run quick AV scan
async function runQuickScan(machineId: string) {
  const response = await fetch(`/api/mde/machines/${machineId}/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scanType: 'Quick',
      comment: 'Routine security scan'
    })
  })

  return await response.json()
}

// Hunt for suspicious activity
async function huntSuspiciousProcesses() {
  const query = `
    DeviceProcessEvents
    | where Timestamp > ago(1d)
    | where ProcessCommandLine contains "mimikatz" or ProcessCommandLine contains "invoke-mimikatz"
    | project Timestamp, DeviceName, FileName, ProcessCommandLine, AccountName
  `

  const response = await fetch('/api/mde/advancedhunting', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  })

  const results = await response.json()
  return results
}
```

### Python

```python
import requests

# Configuration
MDE_API_BASE = "http://localhost:8000/functions/v1/mde"

# List all active machines
def list_active_machines():
    response = requests.get(
        f"{MDE_API_BASE}/machines",
        params={
            "filter": "healthStatus eq 'Active'",
            "top": 50
        }
    )
    return response.json()

# Isolate machine
def isolate_machine(machine_id, reason):
    response = requests.post(
        f"{MDE_API_BASE}/machines/{machine_id}/isolate",
        json={
            "isolationType": "Full",
            "comment": reason
        }
    )
    return response.json()

# Update alert
def update_alert(alert_id, status, classification):
    response = requests.patch(
        f"{MDE_API_BASE}/alerts/{alert_id}",
        json={
            "status": status,
            "classification": classification,
            "comment": f"Updated via API: {classification}"
        }
    )
    return response.json()
```

## 🔍 Troubleshooting

### Authentication Errors

**Error:** `401 Unauthorized`

**Solutions:**
1. Verify Tenant ID, Client ID, and Client Secret are correct
2. Ensure admin consent was granted for all permissions
3. Check if client secret has expired (recreate if needed)
4. Verify app registration is in correct tenant

### Permission Errors

**Error:** `403 Forbidden` or `Insufficient privileges`

**Solutions:**
1. Grant admin consent in Azure Portal
2. Ensure all required permissions are added
3. Wait 5-10 minutes after granting consent
4. Verify permissions are **Application** type (not Delegated)

### Connection Issues

**Error:** `Failed to connect to MDE API`

**Solutions:**
1. Check internet connectivity
2. Verify MDE service is not experiencing outages
3. Test credentials using Microsoft Graph Explorer
4. Check firewall/proxy settings

### Query Errors

**Error:** Advanced hunting query fails

**Solutions:**
1. Verify KQL syntax is correct
2. Ensure table names are valid (DeviceProcessEvents, DeviceNetworkEvents, etc.)
3. Check query doesn't exceed time limits (7-30 days depending on license)
4. Reduce query complexity if timeout occurs

## 📚 Additional Resources

- [MDE API Documentation](https://docs.microsoft.com/en-us/microsoft-365/security/defender-endpoint/apis-intro)
- [Advanced Hunting Schema](https://docs.microsoft.com/en-us/microsoft-365/security/defender/advanced-hunting-schema-tables)
- [KQL Quick Reference](https://docs.microsoft.com/en-us/azure/data-explorer/kql-quick-reference)
- [Response Actions](https://docs.microsoft.com/en-us/microsoft-365/security/defender-endpoint/respond-machine-alerts)

## 🛡️ Security Best Practices

1. **Rotate Secrets**: Change client secrets every 90-180 days
2. **Least Privilege**: Only grant necessary permissions
3. **Audit Actions**: Log all isolation/quarantine actions
4. **Monitor Failures**: Alert on failed authentication attempts
5. **Secure Storage**: Never commit secrets to version control
6. **Separate Tenants**: Use different apps for dev/prod

## 📊 Rate Limits

Microsoft Defender for Endpoint API has the following limits:

- **Per app per tenant**: 100 calls per minute
- **Advanced Hunting**: 15 calls per minute, 15 minutes execution time
- **Machine Actions**: 500 actions per hour

**Best Practices:**
- Implement exponential backoff on 429 responses
- Cache machine and alert data
- Batch operations when possible
- Use filters to reduce response sizes

---

**Need Help?** Check the [main documentation](../README_V2.md) or create an issue on GitHub.

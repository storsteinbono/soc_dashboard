-- Add Microsoft Defender for Endpoint module
INSERT INTO modules (name, display_name, description, version, capabilities, requires_api_key) VALUES
    ('mde', 'Microsoft Defender for Endpoint', 'Enterprise EDR with machine isolation, AV scanning, threat hunting, and automated response', '2.0.0', '["edr", "forensics", "automation", "threat_intelligence"]'::jsonb, true)
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    version = EXCLUDED.version,
    capabilities = EXCLUDED.capabilities;

-- MDE machines table: local cache of machines
CREATE TABLE IF NOT EXISTS mde_machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id VARCHAR(255) UNIQUE NOT NULL, -- MDE machine ID
    computer_dns_name VARCHAR(500),
    computer_name VARCHAR(255),
    os_platform VARCHAR(100),
    os_version VARCHAR(255),
    os_processor VARCHAR(100),
    os_build VARCHAR(100),
    health_status VARCHAR(50), -- Active, Inactive, ImpairedCommunication, NoSensorData
    risk_score VARCHAR(20), -- Low, Medium, High, None
    exposure_level VARCHAR(20), -- Low, Medium, High, None
    aad_device_id VARCHAR(255),
    ip_addresses JSONB DEFAULT '[]'::jsonb,
    mac_addresses JSONB DEFAULT '[]'::jsonb,
    last_ip_address VARCHAR(45),
    last_seen TIMESTAMPTZ,
    first_seen TIMESTAMPTZ,
    onboarding_status VARCHAR(50),
    is_aad_joined BOOLEAN DEFAULT false,
    rbac_group_id INTEGER,
    rbac_group_name VARCHAR(255),
    tags JSONB DEFAULT '[]'::jsonb,
    machine_group VARCHAR(255),
    defect_status VARCHAR(50),
    isolation_status VARCHAR(50), -- None, Isolated, PendingIsolation, etc.
    raw_data JSONB,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MDE alerts table: local cache of alerts
CREATE TABLE IF NOT EXISTS mde_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id VARCHAR(255) UNIQUE NOT NULL, -- MDE alert ID
    incident_id VARCHAR(255),
    title VARCHAR(1000) NOT NULL,
    description TEXT,
    severity VARCHAR(50), -- Informational, Low, Medium, High
    status VARCHAR(50), -- New, InProgress, Resolved
    classification VARCHAR(50), -- TruePositive, FalsePositive, Informational, Unknown
    determination VARCHAR(100),
    category VARCHAR(255),
    detection_source VARCHAR(100),
    threat_family_name VARCHAR(255),
    machine_id VARCHAR(255),
    computer_dns_name VARCHAR(500),
    assigned_to VARCHAR(255),
    resolver VARCHAR(255),
    resolved_time TIMESTAMPTZ,
    first_event_time TIMESTAMPTZ,
    last_event_time TIMESTAMPTZ,
    last_update_time TIMESTAMPTZ,
    created_datetime TIMESTAMPTZ,
    evidence JSONB DEFAULT '[]'::jsonb,
    investigation_id VARCHAR(255),
    investigation_state VARCHAR(50),
    comments JSONB DEFAULT '[]'::jsonb,
    raw_data JSONB,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MDE machine actions table: track response actions
CREATE TABLE IF NOT EXISTS mde_machine_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_id VARCHAR(255) UNIQUE NOT NULL, -- MDE action ID
    action_type VARCHAR(100) NOT NULL, -- Isolate, Unisolate, RunAntiVirusScan, etc.
    machine_id VARCHAR(255),
    requestor VARCHAR(255),
    requestor_comment TEXT,
    status VARCHAR(50), -- Pending, InProgress, Succeeded, Failed, TimeOut, Cancelled
    creation_datetime TIMESTAMPTZ,
    last_update_datetime TIMESTAMPTZ,
    cancellation_datetime TIMESTAMPTZ,
    cancellation_requestor VARCHAR(255),
    cancellation_comment TEXT,
    error_message TEXT,
    scope VARCHAR(50),
    external_id VARCHAR(255),
    requestor_id VARCHAR(255),
    related_file_info JSONB,
    raw_data JSONB,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MDE advanced hunting queries: saved queries
CREATE TABLE IF NOT EXISTS mde_hunting_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    query TEXT NOT NULL,
    category VARCHAR(100),
    tags JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES auth.users(id),
    is_favorite BOOLEAN DEFAULT false,
    execution_count INTEGER DEFAULT 0,
    last_executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MDE indicators: stored threat indicators
CREATE TABLE IF NOT EXISTS mde_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    indicator_id VARCHAR(255) UNIQUE NOT NULL, -- MDE indicator ID
    indicator_value VARCHAR(1000) NOT NULL,
    indicator_type VARCHAR(50) NOT NULL, -- FileSha1, FileSha256, IpAddress, DomainName, Url
    action VARCHAR(50) NOT NULL, -- Alert, AlertAndBlock, Allowed
    title VARCHAR(500) NOT NULL,
    description TEXT,
    severity VARCHAR(50), -- Informational, Low, Medium, High
    application VARCHAR(255),
    expiration_time TIMESTAMPTZ,
    created_by VARCHAR(255),
    created_by_display_name VARCHAR(255),
    creation_time_utc TIMESTAMPTZ,
    last_update_time TIMESTAMPTZ,
    raw_data JSONB,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mde_machines_health ON mde_machines(health_status);
CREATE INDEX IF NOT EXISTS idx_mde_machines_risk ON mde_machines(risk_score);
CREATE INDEX IF NOT EXISTS idx_mde_machines_isolation ON mde_machines(isolation_status);
CREATE INDEX IF NOT EXISTS idx_mde_machines_last_seen ON mde_machines(last_seen);

CREATE INDEX IF NOT EXISTS idx_mde_alerts_severity ON mde_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_mde_alerts_status ON mde_alerts(status);
CREATE INDEX IF NOT EXISTS idx_mde_alerts_machine ON mde_alerts(machine_id);
CREATE INDEX IF NOT EXISTS idx_mde_alerts_created ON mde_alerts(created_datetime);

CREATE INDEX IF NOT EXISTS idx_mde_actions_type ON mde_machine_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_mde_actions_status ON mde_machine_actions(status);
CREATE INDEX IF NOT EXISTS idx_mde_actions_machine ON mde_machine_actions(machine_id);

CREATE INDEX IF NOT EXISTS idx_mde_indicators_type ON mde_indicators(indicator_type);
CREATE INDEX IF NOT EXISTS idx_mde_indicators_value ON mde_indicators(indicator_value);

-- Apply updated_at triggers
CREATE TRIGGER update_mde_machines_updated_at BEFORE UPDATE ON mde_machines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mde_alerts_updated_at BEFORE UPDATE ON mde_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mde_machine_actions_updated_at BEFORE UPDATE ON mde_machine_actions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mde_hunting_queries_updated_at BEFORE UPDATE ON mde_hunting_queries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mde_indicators_updated_at BEFORE UPDATE ON mde_indicators
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE mde_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE mde_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mde_machine_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mde_hunting_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE mde_indicators ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role has full access to mde_machines"
    ON mde_machines FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to mde_alerts"
    ON mde_alerts FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to mde_machine_actions"
    ON mde_machine_actions FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to mde_hunting_queries"
    ON mde_hunting_queries FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to mde_indicators"
    ON mde_indicators FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Authenticated users can read
CREATE POLICY "Authenticated users can read mde_machines"
    ON mde_machines FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can read mde_alerts"
    ON mde_alerts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can read mde_machine_actions"
    ON mde_machine_actions FOR SELECT
    TO authenticated
    USING (true);

-- Authenticated users can manage their own hunting queries
CREATE POLICY "Users can manage their own hunting queries"
    ON mde_hunting_queries FOR ALL
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Authenticated users can read mde_indicators"
    ON mde_indicators FOR SELECT
    TO authenticated
    USING (true);

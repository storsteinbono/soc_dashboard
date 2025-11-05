-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Modules table: stores information about installed modules
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(50) DEFAULT '1.0.0',
    status VARCHAR(50) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error', 'initializing')),
    capabilities JSONB DEFAULT '[]'::jsonb,
    config JSONB DEFAULT '{}'::jsonb,
    health_status JSONB DEFAULT '{}'::jsonb,
    requires_api_key BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Module configurations table: stores API keys and settings securely
CREATE TABLE IF NOT EXISTS module_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    key VARCHAR(255) NOT NULL,
    value TEXT, -- Encrypted in application layer
    is_secret BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(module_id, key)
);

-- TheHive cases table: local cache of cases for faster access
CREATE TABLE IF NOT EXISTS thehive_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id VARCHAR(255) UNIQUE NOT NULL, -- TheHive case ID
    title VARCHAR(500) NOT NULL,
    description TEXT,
    severity INTEGER DEFAULT 2,
    tlp INTEGER DEFAULT 2,
    status VARCHAR(50) DEFAULT 'Open',
    tags JSONB DEFAULT '[]'::jsonb,
    observables JSONB DEFAULT '[]'::jsonb,
    tasks JSONB DEFAULT '[]'::jsonb,
    raw_data JSONB,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LimaCharlie sensors table: local cache of sensors
CREATE TABLE IF NOT EXISTS limacharlie_sensors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sensor_id VARCHAR(255) UNIQUE NOT NULL, -- LimaCharlie sensor ID
    hostname VARCHAR(255),
    platform VARCHAR(100),
    online BOOLEAN DEFAULT false,
    isolated BOOLEAN DEFAULT false,
    last_seen BIGINT,
    tags JSONB DEFAULT '[]'::jsonb,
    raw_data JSONB,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Detection events table: stores detection events from various sources
CREATE TABLE IF NOT EXISTS detection_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source VARCHAR(100) NOT NULL, -- 'limacharlie', 'thehive', etc.
    event_id VARCHAR(255),
    severity VARCHAR(50) DEFAULT 'medium',
    title VARCHAR(500) NOT NULL,
    description TEXT,
    raw_data JSONB,
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID,
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Threat intelligence cache: cache results from threat intel APIs
CREATE TABLE IF NOT EXISTS threat_intel_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source VARCHAR(100) NOT NULL, -- 'virustotal', 'shodan', etc.
    indicator_type VARCHAR(50) NOT NULL, -- 'hash', 'ip', 'domain', 'url'
    indicator_value VARCHAR(500) NOT NULL,
    result JSONB,
    cached_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(source, indicator_type, indicator_value)
);

-- Create indexes for performance
CREATE INDEX idx_modules_status ON modules(status);
CREATE INDEX idx_modules_name ON modules(name);
CREATE INDEX idx_thehive_cases_status ON thehive_cases(status);
CREATE INDEX idx_limacharlie_sensors_online ON limacharlie_sensors(online);
CREATE INDEX idx_detection_events_severity ON detection_events(severity);
CREATE INDEX idx_detection_events_acknowledged ON detection_events(acknowledged);
CREATE INDEX idx_threat_intel_cache_lookup ON threat_intel_cache(source, indicator_type, indicator_value);
CREATE INDEX idx_threat_intel_cache_expires ON threat_intel_cache(expires_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_module_configs_updated_at BEFORE UPDATE ON module_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_thehive_cases_updated_at BEFORE UPDATE ON thehive_cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_limacharlie_sensors_updated_at BEFORE UPDATE ON limacharlie_sensors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_detection_events_updated_at BEFORE UPDATE ON detection_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default modules
INSERT INTO modules (name, display_name, description, capabilities, requires_api_key) VALUES
    ('thehive', 'TheHive', 'Full incident management and case handling integration with TheHive', '["incident_management", "automation"]'::jsonb, true),
    ('limacharlie', 'LimaCharlie', 'Full EDR and telemetry management with detection and response capabilities', '["edr", "forensics", "automation"]'::jsonb, true),
    ('virustotal', 'VirusTotal', 'Threat intelligence for files, URLs, IPs, and domains', '["threat_intelligence", "reputation"]'::jsonb, true),
    ('shodan', 'Shodan', 'Internet-wide asset discovery and vulnerability scanning', '["network_analysis", "threat_intelligence"]'::jsonb, true),
    ('abuseipdb', 'AbuseIPDB', 'IP reputation checking and abuse reporting', '["reputation", "threat_intelligence"]'::jsonb, true),
    ('urlscan', 'URLScan.io', 'URL analysis and phishing detection', '["threat_intelligence", "network_analysis"]'::jsonb, true)
ON CONFLICT (name) DO NOTHING;

-- Row Level Security (RLS) policies can be added here
-- For now, we'll add basic policies

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE thehive_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE limacharlie_sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE detection_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE threat_intel_cache ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for Edge Functions)
CREATE POLICY "Service role has full access to modules"
    ON modules FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to module_configs"
    ON module_configs FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to read modules
CREATE POLICY "Authenticated users can read modules"
    ON modules FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to read cases
CREATE POLICY "Authenticated users can read cases"
    ON thehive_cases FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to read sensors
CREATE POLICY "Authenticated users can read sensors"
    ON limacharlie_sensors FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to read detection events
CREATE POLICY "Authenticated users can read detection events"
    ON detection_events FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to read threat intel cache
CREATE POLICY "Authenticated users can read threat intel cache"
    ON threat_intel_cache FOR SELECT
    TO authenticated
    USING (true);

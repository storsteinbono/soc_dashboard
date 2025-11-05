import React, { useState } from 'react';
import './Module.css';

function ThreatIntelligence() {
  const [searchType, setSearchType] = useState('hash');
  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResults(null);

    try {
      let endpoint = '';
      switch (searchType) {
        case 'hash':
          endpoint = `/api/v1/virustotal/files/${searchValue}`;
          break;
        case 'ip':
          endpoint = `/api/v1/virustotal/ip/${searchValue}`;
          break;
        case 'domain':
          endpoint = `/api/v1/virustotal/domains/${searchValue}`;
          break;
        default:
          return;
      }

      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        setResults({ error: 'Not found or API not configured' });
      }
    } catch (err) {
      setResults({ error: 'Failed to fetch data' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="module-page">
      <div className="page-header">
        <h1>🔍 Threat Intelligence</h1>
        <p>Analyze files, IPs, domains, and URLs using multiple intelligence sources</p>
      </div>

      <div className="card">
        <h3>Search IOC</h3>
        <form onSubmit={handleSearch} className="search-form">
          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
              >
                <option value="hash">File Hash</option>
                <option value="ip">IP Address</option>
                <option value="domain">Domain</option>
                <option value="url">URL</option>
              </select>
            </div>

            <div className="form-group" style={{ flex: 2 }}>
              <label>Value</label>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={`Enter ${searchType}...`}
                required
              />
            </div>

            <div className="form-group">
              <label>&nbsp;</label>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {results && (
        <div className="card">
          <h3>Results</h3>
          {results.error ? (
            <div className="error">{results.error}</div>
          ) : (
            <div className="results-container">
              <pre style={{
                background: '#0f1729',
                padding: '20px',
                borderRadius: '8px',
                overflow: 'auto',
                maxHeight: '500px',
                color: '#e0e0e0'
              }}>
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-3">
        <div className="card">
          <h3>🦠 VirusTotal</h3>
          <p>File, URL, IP, and domain analysis</p>
          <ul style={{ color: '#7a8ca0', marginTop: '10px' }}>
            <li>File hash reputation</li>
            <li>URL scanning</li>
            <li>IP & domain analysis</li>
          </ul>
        </div>

        <div className="card">
          <h3>🌐 Shodan</h3>
          <p>Internet-wide asset discovery</p>
          <ul style={{ color: '#7a8ca0', marginTop: '10px' }}>
            <li>Host lookups</li>
            <li>Service discovery</li>
            <li>Exploit search</li>
          </ul>
        </div>

        <div className="card">
          <h3>🚫 AbuseIPDB</h3>
          <p>IP reputation checking</p>
          <ul style={{ color: '#7a8ca0', marginTop: '10px' }}>
            <li>IP abuse reports</li>
            <li>Blacklist checking</li>
            <li>Report malicious IPs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ThreatIntelligence;

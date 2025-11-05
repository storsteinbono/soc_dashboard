import React, { useState, useEffect } from 'react';
import './Module.css';

function TheHive() {
  const [cases, setCases] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCases();
    fetchAlerts();
  }, []);

  const fetchCases = async () => {
    try {
      const response = await fetch('/api/v1/thehive/cases');
      if (response.ok) {
        const data = await response.json();
        setCases(data);
      }
    } catch (err) {
      setError('Failed to load cases');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/v1/thehive/alerts');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (err) {
      console.error('Failed to load alerts');
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      1: 'info',
      2: 'warning',
      3: 'error',
      4: 'error'
    };
    return colors[severity] || 'info';
  };

  if (loading) return <div className="loading">Loading TheHive data...</div>;

  return (
    <div className="module-page">
      <div className="page-header">
        <h1>🐝 TheHive - Incident Management</h1>
        <p>Manage security incidents and case workflows</p>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="grid grid-2">
        <div className="card">
          <h3>Recent Cases</h3>
          {cases.length === 0 ? (
            <p style={{ color: '#7a8ca0' }}>No cases found. Configure TheHive API to see cases.</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.slice(0, 10).map((case_item, index) => (
                    <tr key={index}>
                      <td>{case_item.title}</td>
                      <td>
                        <span className={`badge badge-${getSeverityColor(case_item.severity)}`}>
                          {case_item.severity}
                        </span>
                      </td>
                      <td>{case_item.status}</td>
                      <td>{new Date(case_item.startDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <h3>Recent Alerts</h3>
          {alerts.length === 0 ? (
            <p style={{ color: '#7a8ca0' }}>No alerts found.</p>
          ) : (
            <div className="alert-list">
              {alerts.slice(0, 5).map((alert, index) => (
                <div key={index} className="alert-item">
                  <div className="alert-header">
                    <strong>{alert.title}</strong>
                    <span className={`badge badge-${getSeverityColor(alert.severity)}`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p>{alert.description}</p>
                  <div className="alert-footer">
                    <span>{new Date(alert.date).toLocaleString()}</span>
                    <button className="btn btn-primary btn-sm">Promote to Case</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button className="btn btn-primary">Create New Case</button>
          <button className="btn btn-secondary">View All Cases</button>
          <button className="btn btn-secondary">View All Alerts</button>
        </div>
      </div>
    </div>
  );
}

export default TheHive;

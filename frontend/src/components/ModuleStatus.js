import React from 'react';
import './Module.css';

function ModuleStatus({ modules, health }) {
  return (
    <div className="module-page">
      <div className="page-header">
        <h1>💚 System Status</h1>
        <p>Monitor the health and status of all modules</p>
      </div>

      {health && (
        <div className="card">
          <h3>Overall System Health</h3>
          <div className="health-summary">
            <div className="health-metric">
              <div className="metric-label">System Status</div>
              <span className={`badge badge-${health.status === 'healthy' ? 'success' : 'error'}`}>
                {health.status.toUpperCase()}
              </span>
            </div>
            <div className="health-metric">
              <div className="metric-label">Modules Loaded</div>
              <div className="metric-value">{health.modules_loaded}</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-2">
        {modules.map((module, index) => (
          <div key={index} className="card module-status-card">
            <div className="module-status-header">
              <h3>{module.info?.name || module.name}</h3>
              <span className={`badge badge-${module.status === 'active' ? 'success' : 'error'}`}>
                {module.status}
              </span>
            </div>

            <p style={{ color: '#7a8ca0', marginBottom: '15px' }}>
              {module.info?.description}
            </p>

            <div className="module-details">
              <div className="detail-item">
                <span className="detail-label">Version:</span>
                <span>{module.info?.version || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Requires API Key:</span>
                <span>{module.info?.requires_api_key ? 'Yes' : 'No'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Capabilities:</span>
                <div className="capabilities">
                  {module.info?.capabilities?.map((cap, i) => (
                    <span key={i} className="badge badge-info">
                      {cap.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {health?.modules?.[module.name] && (
              <div className="module-health-info">
                <strong>Health Check:</strong>
                <p style={{ color: '#7a8ca0', marginTop: '5px' }}>
                  {health.modules[module.name].message || 'OK'}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ModuleStatus;

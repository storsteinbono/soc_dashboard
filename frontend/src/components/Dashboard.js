import React from 'react';
import './Dashboard.css';

function Dashboard({ modules, health }) {
  const getModulesByCapability = (capability) => {
    return modules.filter(m =>
      m.info?.capabilities?.includes(capability)
    );
  };

  const activeModules = modules.filter(m => m.status === 'active').length;
  const totalModules = modules.length;

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Security Operations Dashboard</h1>
        <p>Real-time overview of your security infrastructure</p>
      </div>

      <div className="grid grid-4">
        <div className="stat-card">
          <div className="stat-icon">🛡️</div>
          <div className="stat-content">
            <div className="stat-label">Active Modules</div>
            <div className="stat-value">{activeModules}/{totalModules}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🐝</div>
          <div className="stat-content">
            <div className="stat-label">Incident Management</div>
            <div className="stat-value">
              {getModulesByCapability('incident_management').length}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔍</div>
          <div className="stat-content">
            <div className="stat-label">Threat Intel</div>
            <div className="stat-value">
              {getModulesByCapability('threat_intelligence').length}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🦎</div>
          <div className="stat-content">
            <div className="stat-label">EDR Systems</div>
            <div className="stat-value">
              {getModulesByCapability('edr').length}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>🔧 Available Modules</h3>
          <div className="module-list">
            {modules.map((module, index) => (
              <div key={index} className="module-item">
                <div className="module-info">
                  <strong>{module.info?.name || module.name}</strong>
                  <p>{module.info?.description}</p>
                </div>
                <span className={`badge badge-${module.status === 'active' ? 'success' : 'error'}`}>
                  {module.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>📊 System Health</h3>
          {health && (
            <div className="health-details">
              <div className="health-item">
                <span className="health-label">Overall Status:</span>
                <span className={`badge badge-${health.status === 'healthy' ? 'success' : 'error'}`}>
                  {health.status}
                </span>
              </div>
              <div className="health-item">
                <span className="health-label">Modules Loaded:</span>
                <span>{health.modules_loaded}</span>
              </div>

              <h4 style={{ marginTop: '20px', marginBottom: '10px', color: '#4fc3f7' }}>
                Module Health Status
              </h4>
              {Object.entries(health.modules || {}).map(([name, status]) => (
                <div key={name} className="module-health">
                  <span className="module-name">{name}</span>
                  <span className={`badge badge-${status.status === 'healthy' ? 'success' : 'error'}`}>
                    {status.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3>🚀 Quick Actions</h3>
        <div className="quick-actions">
          <button className="btn btn-primary">View All Cases</button>
          <button className="btn btn-primary">Check Sensors</button>
          <button className="btn btn-primary">Analyze IOC</button>
          <button className="btn btn-primary">Search Events</button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

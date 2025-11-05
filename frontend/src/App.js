import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Dashboard from './components/Dashboard';
import TheHive from './components/TheHive';
import LimaCharlie from './components/LimaCharlie';
import ThreatIntelligence from './components/ThreatIntelligence';
import ModuleStatus from './components/ModuleStatus';

function App() {
  const [modules, setModules] = useState([]);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetchModules();
    fetchHealth();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchHealth();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchModules = async () => {
    try {
      const response = await fetch('/api/v1/modules');
      const data = await response.json();
      setModules(data.modules || []);
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/v1/health');
      const data = await response.json();
      setHealth(data);
    } catch (error) {
      console.error('Error fetching health:', error);
    }
  };

  return (
    <Router>
      <div className="App">
        <nav className="sidebar">
          <div className="logo">
            <h2>🛡️ SOC Dashboard</h2>
          </div>

          <div className="nav-section">
            <h3>Main</h3>
            <Link to="/" className="nav-item">
              <span>📊</span> Dashboard
            </Link>
            <Link to="/status" className="nav-item">
              <span>💚</span> System Status
            </Link>
          </div>

          <div className="nav-section">
            <h3>Incident Management</h3>
            <Link to="/thehive" className="nav-item">
              <span>🐝</span> TheHive
            </Link>
          </div>

          <div className="nav-section">
            <h3>EDR & Response</h3>
            <Link to="/limacharlie" className="nav-item">
              <span>🦎</span> LimaCharlie
            </Link>
          </div>

          <div className="nav-section">
            <h3>Threat Intelligence</h3>
            <Link to="/threat-intel" className="nav-item">
              <span>🔍</span> Analysis Tools
            </Link>
          </div>

          <div className="health-indicator">
            {health && (
              <>
                <div className="health-status">
                  <span className={`status-dot ${health.status}`}></span>
                  <span>{health.status}</span>
                </div>
                <div className="modules-count">
                  {health.modules_loaded} modules loaded
                </div>
              </>
            )}
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard modules={modules} health={health} />} />
            <Route path="/status" element={<ModuleStatus modules={modules} health={health} />} />
            <Route path="/thehive" element={<TheHive />} />
            <Route path="/limacharlie" element={<LimaCharlie />} />
            <Route path="/threat-intel" element={<ThreatIntelligence />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

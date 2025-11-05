import React, { useState, useEffect } from 'react';
import './Module.css';

function LimaCharlie() {
  const [sensors, setSensors] = useState([]);
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSensors();
    fetchDetections();
  }, []);

  const fetchSensors = async () => {
    try {
      const response = await fetch('/api/v1/limacharlie/sensors');
      if (response.ok) {
        const data = await response.json();
        setSensors(data);
      }
    } catch (err) {
      setError('Failed to load sensors');
    } finally {
      setLoading(false);
    }
  };

  const fetchDetections = async () => {
    try {
      const response = await fetch('/api/v1/limacharlie/detections');
      if (response.ok) {
        const data = await response.json();
        setDetections(data);
      }
    } catch (err) {
      console.error('Failed to load detections');
    }
  };

  const handleIsolateSensor = async (sensorId) => {
    if (!window.confirm('Are you sure you want to isolate this sensor?')) return;

    try {
      const response = await fetch(`/api/v1/limacharlie/sensors/${sensorId}/isolate`, {
        method: 'POST'
      });
      if (response.ok) {
        alert('Sensor isolated successfully');
        fetchSensors();
      }
    } catch (err) {
      alert('Failed to isolate sensor');
    }
  };

  if (loading) return <div className="loading">Loading LimaCharlie data...</div>;

  return (
    <div className="module-page">
      <div className="page-header">
        <h1>🦎 LimaCharlie - EDR & Response</h1>
        <p>Endpoint detection, response, and telemetry management</p>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="grid grid-3">
        <div className="stat-card">
          <div className="stat-icon">💻</div>
          <div className="stat-content">
            <div className="stat-label">Total Sensors</div>
            <div className="stat-value">{sensors.length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-label">Online Sensors</div>
            <div className="stat-value">
              {sensors.filter(s => s.online).length}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🚨</div>
          <div className="stat-content">
            <div className="stat-label">Detections</div>
            <div className="stat-value">{detections.length}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Sensors</h3>
        {sensors.length === 0 ? (
          <p style={{ color: '#7a8ca0' }}>No sensors found. Configure LimaCharlie API to see sensors.</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Hostname</th>
                  <th>Platform</th>
                  <th>Status</th>
                  <th>Last Seen</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sensors.slice(0, 20).map((sensor, index) => (
                  <tr key={index}>
                    <td>{sensor.hostname || sensor.sid}</td>
                    <td>{sensor.platform}</td>
                    <td>
                      <span className={`badge badge-${sensor.online ? 'success' : 'error'}`}>
                        {sensor.online ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td>{sensor.last_seen ? new Date(sensor.last_seen * 1000).toLocaleString() : 'N/A'}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleIsolateSensor(sensor.sid)}
                      >
                        Isolate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Recent Detections</h3>
        {detections.length === 0 ? (
          <p style={{ color: '#7a8ca0' }}>No detections found.</p>
        ) : (
          <div className="detection-list">
            {detections.slice(0, 10).map((detection, index) => (
              <div key={index} className="detection-item">
                <div className="detection-header">
                  <strong>{detection.cat || 'Detection'}</strong>
                  <span className="badge badge-warning">Alert</span>
                </div>
                <p>{detection.detect?.summary || 'Security detection triggered'}</p>
                <div className="detection-footer">
                  <span>Sensor: {detection.routing?.hostname}</span>
                  <span>{new Date(detection.detect?.ts * 1000).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default LimaCharlie;

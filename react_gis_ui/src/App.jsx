import React, { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ColumnLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { FlyToInterpolator } from '@deck.gl/core';

const STADIA_API_KEY = "b7b66166-56ab-4599-9ad0-13a9bae45df8";

const STADIA_RASTER_MAP_STYLE = {
  version: 8,
  sources: {
    'stadia-dark-tiles': {
      type: 'raster',
      tiles: [`https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}@2x.png?api_key=${STADIA_API_KEY}`],
      tileSize: 256,
      attribution: '&copy; Stadia Maps'
    }
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#0d1117' } },
    { id: 'stadia-dark-layer', type: 'raster', source: 'stadia-dark-tiles', minzoom: 0, maxzoom: 20 }
  ]
};

function ReportFraud({ onComplaintSubmitted }) {
  const [formData, setFormData] = useState({
    utr_number: '',
    victim_account: '',
    beneficiary_account: '',
    amount: '',
    off_ramp_type: 'MICRO_ATM'
  });

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || '' : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    // Network-free GNN Simulation for Vercel
    setTimeout(() => {
      const predictionZones = [
        { h3: '8860b52623fffff', coords: [76.6394, 12.2958], name: 'Mysuru - Saraswathipuram ATM Zone' },
        { h3: '8860b52467fffff', coords: [76.6280, 12.2850], name: 'Mysuru - Kuvempunagar Hub' },
        { h3: '8860145b43fffff', coords: [77.5946, 12.9716], name: 'Bengaluru - MG Road District' }
      ];

      const prediction = predictionZones[Math.floor(Math.random() * predictionZones.length)];
      const generatedRisk = (0.85 + Math.random() * 0.14).toFixed(2);

      const mockGNNResult = {
        transaction_id: formData.utr_number || `UTR-${Math.floor(100000 + Math.random() * 900000)}`,
        risk_score: parseFloat(generatedRisk),
        automated_hold: true,
        target_jurisdiction: prediction.name,
        h3_index: prediction.h3,
        coordinates: prediction.coords
      };

      setStatusMessage({
        type: 'success',
        text: `INTERCEPT: ${prediction.name} | HOLD: ACTIVE`
      });

      if (onComplaintSubmitted) onComplaintSubmitted(mockGNNResult);

      setFormData(prev => ({ ...prev, utr_number: '', victim_account: '', beneficiary_account: '', amount: '' }));
      setLoading(false);
    }, 800);
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.panelTitle}>1930 Cyber Fraud Intake</h3>
      <div style={styles.divider}></div>

      {statusMessage && (
        <div style={{
          ...styles.badge,
          backgroundColor: statusMessage.type === 'success' ? '#166534' : '#991b1b',
          border: `1px solid ${statusMessage.type === 'success' ? '#22c55e' : '#ef4444'}`
        }}>
          {statusMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.row}>
          <label style={styles.label}>Bank Ref / UTR Number</label>
          <input type="text" name="utr_number" placeholder="UTR99881123" value={formData.utr_number} onChange={handleChange} style={styles.input} required />
        </div>
        <div style={styles.row}>
          <label style={styles.label}>Victim Account / UPI ID</label>
          <input type="text" name="victim_account" placeholder="9988776655@upi" value={formData.victim_account} onChange={handleChange} style={styles.input} required />
        </div>
        <div style={styles.row}>
          <label style={styles.label}>Fraudulent Account / UPI</label>
          <input type="text" name="beneficiary_account" placeholder="suspect_mule@upi" value={formData.beneficiary_account} onChange={handleChange} style={styles.input} required />
        </div>
        <div style={styles.row}>
          <label style={styles.label}>Defrauded Amount (₹)</label>
          <input type="number" name="amount" placeholder="50000" value={formData.amount} onChange={handleChange} style={styles.input} required />
        </div>
        <div style={styles.row}>
          <label style={styles.label}>Withdrawal Channel</label>
          <select name="off_ramp_type" value={formData.off_ramp_type} onChange={handleChange} style={styles.input}>
            <option value="MICRO_ATM">Micro ATM / CSP Point</option>
            <option value="ATM">Bank ATM</option>
            <option value="POS_TERMINAL">POS Terminal / Merchant</option>
            <option value="CRYPTO_OFFRAMP">Crypto Exchange Off-Ramp</option>
          </select>
        </div>
        <button type="submit" disabled={loading} style={styles.submitBtn}>
          {loading ? 'Evaluating Graph Sub-Net...' : 'Execute Automated Interdiction'}
        </button>
      </form>
    </div>
  );
}

export default function App() {
  const [alerts, setAlerts] = useState([]);

  // Dynamic ViewState to allow auto-navigation
  const [viewState, setViewState] = useState({
    longitude: 76.6394,
    latitude: 12.2958,
    zoom: 10.5,
    pitch: 45,
    bearing: 0
  });

  const handleNewAlert = (newAlert) => {
    setAlerts((prev) => [...prev, newAlert]);

    // Auto-navigate (Fly) to the exact predicted coordinates
    setViewState({
      longitude: newAlert.coordinates[0],
      latitude: newAlert.coordinates[1],
      zoom: 14.5, // Zooms in close for a tactical view
      pitch: 60,  // Tilts the camera up to see the 3D hexagon height
      bearing: 0,
      transitionDuration: 2500, // 2.5 second smooth flight
      transitionInterpolator: new FlyToInterpolator()
    });
  };

  useEffect(() => {
    try {
      const ws = new WebSocket('ws://localhost:8080/ws');
      ws.onmessage = (event) => handleNewAlert(JSON.parse(event.data));
      return () => ws.close();
    } catch (err) {
      console.warn("WS Offline - Using Simulation.");
    }
  }, []);

  const layers = [
    // Layer 1: Ground-level Heatmap
    new HeatmapLayer({
      id: 'heatmap-layer',
      data: alerts,
      getPosition: d => d.coordinates,
      getWeight: d => d.risk_score * 100,
      radiusPixels: 80,
      intensity: 1.5,
      threshold: 0.05,
      updateTriggers: {
        getPosition: [alerts]
      }
    }),
    // Layer 2: Solid, Professional 3D Hexagon Pillars
    new ColumnLayer({
      id: 'tactical-3d-hexagons',
      data: alerts,
      diskResolution: 6, // Perfect Hexagon
      radius: 80, // Slender tactical width
      extruded: true,
      pickable: true,
      elevationScale: 50,
      getPosition: d => d.coordinates,
      getFillColor: d => d.risk_score > 0.85 ? [220, 38, 38, 255] : [217, 119, 6, 255], // Matte Red / Matte Amber
      getElevation: d => (d.risk_score * 100),
      material: {
        ambient: 0.4,
        diffuse: 0.8,
        shininess: 32,
        specularColor: [60, 64, 70]
      },
      updateTriggers: {
        getPosition: [alerts],
        getElevation: [alerts],
        getFillColor: [alerts]
      }
    })
  ];

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', backgroundColor: '#0d1117' }}>

      {/* HUD Header */}
      <div style={styles.hudHeader}>
        <h2>SENTINELGRID: Layer-1 Interdiction Console</h2>
        <span style={styles.statusIndicator}>● SECURE CONNECTION</span>
      </div>

      <div style={{ ...styles.container, left: 20, right: 'auto', width: '320px' }}>
        <h3 style={styles.panelTitle}>Active Threat Topography</h3>
        <div style={styles.divider}></div>
        <p style={{ fontSize: '12px', color: '#8b949e' }}>Identified Cartel Off-Ramps: {alerts.length}</p>
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {alerts.map((a, i) => (
            <div key={i} style={styles.alertCard}>
              <strong style={{ color: '#c9d1d9' }}>TXN:</strong> {a.transaction_id} <br />
              <strong style={{ color: '#c9d1d9' }}>Confidence:</strong> {(a.risk_score * 100).toFixed(1)}% <br />
              <strong style={{ color: '#c9d1d9' }}>Sector:</strong> {a.target_jurisdiction} <br />
              {a.automated_hold && <span style={{ color: '#f87171', fontWeight: 'bold', display: 'block', marginTop: '4px' }}>[ API DEBIT HOLD EXECUTED ]</span>}
            </div>
          ))}
        </div>
      </div>

      <ReportFraud onComplaintSubmitted={handleNewAlert} />

      <DeckGL
        viewState={viewState}
        onViewStateChange={e => setViewState(e.viewState)}
        controller={true}
        layers={layers}
      >
        <Map reuseMaps mapStyle={STADIA_RASTER_MAP_STYLE} style={{ width: '100%', height: '100%' }} />
      </DeckGL>
    </div>
  );
}

// Enterprise / Tactical Styles
const styles = {
  hudHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '40px',
    backgroundColor: '#010409',
    borderBottom: '1px solid #30363d',
    zIndex: 100,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 20px',
    color: '#8b949e',
    fontFamily: 'monospace'
  },
  statusIndicator: {
    color: '#2ea043',
    fontSize: '12px',
    fontWeight: 'bold',
    letterSpacing: '1px'
  },
  container: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 20,
    width: '360px',
    background: 'rgba(13, 17, 23, 0.95)',
    border: '1px solid #30363d',
    borderRadius: '4px',
    padding: '24px',
    color: '#c9d1d9',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
  },
  panelTitle: {
    marginTop: 0,
    marginBottom: '8px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#58a6ff',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  divider: {
    height: '1px',
    width: '100%',
    backgroundColor: '#30363d',
    marginBottom: '16px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  row: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '11px',
    color: '#8b949e',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  input: {
    background: '#010409',
    border: '1px solid #30363d',
    borderRadius: '4px',
    padding: '8px 12px',
    color: '#c9d1d9',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
  },
  submitBtn: {
    marginTop: '12px',
    background: '#238636',
    border: '1px solid rgba(240, 246, 252, 0.1)',
    borderRadius: '4px',
    padding: '10px',
    color: '#ffffff',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  badge: {
    padding: '10px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    lineHeight: '1.4',
    marginBottom: '16px',
    fontWeight: '500',
    color: '#ffffff'
  },
  alertCard: {
    border: '1px solid #30363d',
    backgroundColor: '#010409',
    padding: '12px',
    marginTop: '10px',
    fontSize: '12px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    color: '#8b949e'
  }
};
import React, { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ScatterplotLayer, ColumnLayer } from '@deck.gl/layers';

const STADIA_API_KEY = "b7b66166-56ab-4599-9ad0-13a9bae45df8";
const INITIAL_VIEW_STATE = {
  longitude: 76.6394,
  latitude: 12.2958,
  zoom: 11,
  pitch: 45,
  bearing: 0
};

const STADIA_RASTER_MAP_STYLE = {
  version: 8,
  sources: {
    'stadia-dark-tiles': {
      type: 'raster',
      tiles: [
        `https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}@2x.png?api_key=${STADIA_API_KEY}`
      ],
      tileSize: 256,
      attribution: '&copy; Stadia Maps &copy; OpenStreetMap'
    }
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#111' } },
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

    // Completely network-free GNN Simulation for Vercel
    setTimeout(() => {
      // 1. GNN calculates potential target zones based on transaction velocity
      const predictionZones = [
        { h3: '8860b52623fffff', coords: [76.6394, 12.2958], name: 'Mysuru - Saraswathipuram ATM Zone' },
        { h3: '8860b52467fffff', coords: [76.6280, 12.2850], name: 'Mysuru - Kuvempunagar Hub' },
        { h3: '8860145b43fffff', coords: [77.5946, 12.9716], name: 'Bengaluru - MG Road District' }
      ];

      // 2. Algorithm selects the highest probability node
      const prediction = predictionZones[Math.floor(Math.random() * predictionZones.length)];
      const generatedRisk = (0.85 + Math.random() * 0.14).toFixed(2); // Random high risk 85-99%

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
        text: `GNN Intercept! Target: ${prediction.name} | Auto-Hold: ACTIVE`
      });

      if (onComplaintSubmitted) onComplaintSubmitted(mockGNNResult);

      setFormData(prev => ({ ...prev, utr_number: '', victim_account: '', beneficiary_account: '', amount: '' }));
      setLoading(false);
    }, 800); // 800ms latency to simulate tensor math
  };

  return (
    <div style={styles.container}>
      <h3 style={{ marginTop: 0, color: '#00e676' }}>1930 Cyber Fraud Intake</h3>
      <p style={{ fontSize: '12px', color: '#ccc' }}>
        Log instant financial theft complaints for real-time GNN risk evaluation and tactical interdiction.
      </p>

      {statusMessage && (
        <div style={{
          ...styles.badge,
          backgroundColor: statusMessage.type === 'success' ? '#1b5e20' : statusMessage.type === 'error' ? '#b71c1c' : '#0277bd'
        }}>
          {statusMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.row}>
          <label style={styles.label}>Bank Ref / UTR Number</label>
          <input type="text" name="utr_number" placeholder="e.g. UTR99881123" value={formData.utr_number} onChange={handleChange} style={styles.input} required />
        </div>

        <div style={styles.row}>
          <label style={styles.label}>Your Account / UPI ID</label>
          <input type="text" name="victim_account" placeholder="e.g. 9988776655@upi" value={formData.victim_account} onChange={handleChange} style={styles.input} required />
        </div>

        <div style={styles.row}>
          <label style={styles.label}>Fraudulent Transfer Account / UPI</label>
          <input type="text" name="beneficiary_account" placeholder="e.g. suspect_mule@upi" value={formData.beneficiary_account} onChange={handleChange} style={styles.input} required />
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
          {loading ? 'Running GNN Inference...' : 'Register Complaint & Freeze Funds'}
        </button>
      </form>
    </div>
  );
}

export default function App() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    try {
      const ws = new WebSocket('ws://localhost:8080/ws');
      ws.onopen = () => console.log('Connected to Go Dispatcher');
      ws.onmessage = (event) => {
        const newAlert = JSON.parse(event.data);
        setAlerts((prev) => [...prev, newAlert]);
      };
      ws.onerror = () => console.warn('Local WebSocket server unreachable. Relying on simulated polling.');
      return () => ws.close();
    } catch (err) {
      console.warn("WebSocket initialization failed.");
    }
  }, []);

  const layers = [
    new ColumnLayer({
      id: 'tactical-3d-hexagons',
      data: alerts,
      diskResolution: 6,
      radius: 200, // Shrunk to a tight 200-meter tactical zone
      extruded: true,
      pickable: true,
      elevationScale: 12, // Lowered the height to prevent screen-blocking
      getPosition: d => d.coordinates,
      // The 4th number (130) makes it 50% transparent so you can see the map underneath
      getFillColor: d => d.risk_score > 0.80 ? [255, 0, 0, 130] : [255, 165, 0, 130],
      getElevation: d => (d.risk_score * 100),
      updateTriggers: {
        getPosition: [alerts],
        getElevation: [alerts],
        getFillColor: [alerts]
      }
    })
  ];

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', backgroundColor: '#111' }}>
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 10,
        background: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(8px)',
        padding: '20px',
        color: 'white',
        borderRadius: '12px',
        fontFamily: 'sans-serif',
        border: '1px solid #334155',
        width: '300px'
      }}>
        <h2 style={{ marginTop: 0, fontSize: '18px', color: '#00b0ff' }}>Live Interceptor Grid</h2>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>Active Threat Cells: {alerts.length}</p>
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {alerts.map((a, i) => (
            <div key={i} style={{ borderBottom: '1px solid #334155', paddingBottom: '10px', marginTop: '10px', fontSize: '12px' }}>
              <strong>TXN:</strong> {a.transaction_id} <br />
              <strong>Risk Score:</strong> {(a.risk_score * 100).toFixed(1)}% <br />
              <strong>Target Zone:</strong> {a.target_jurisdiction} <br />
              {a.automated_hold && <span style={{ color: '#ff1744', fontWeight: 'bold' }}>⚠️ AUTO-HOLD ENGAGED</span>}
            </div>
          ))}
        </div>
      </div>

      <ReportFraud onComplaintSubmitted={(newAlert) => setAlerts(prev => [...prev, newAlert])} />

      <DeckGL initialViewState={INITIAL_VIEW_STATE} controller={true} layers={layers}>
        <Map reuseMaps mapStyle={STADIA_RASTER_MAP_STYLE} style={{ width: '100%', height: '100%' }} />
      </DeckGL>
    </div>
  );
}

const styles = {
  container: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 20,
    width: '340px',
    background: 'rgba(15, 23, 42, 0.92)',
    backdropFilter: 'blur(8px)',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '20px',
    color: '#f8fafc',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '10px'
  },
  row: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  label: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#94a3b8',
    fontWeight: '600'
  },
  input: {
    background: '#0f172a',
    border: '1px solid #475569',
    borderRadius: '6px',
    padding: '8px 10px',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
  },
  submitBtn: {
    marginTop: '8px',
    background: 'linear-gradient(135deg, #00e676 0%, #00b0ff 100%)',
    border: 'none',
    borderRadius: '6px',
    padding: '10px',
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: '14px',
    cursor: 'pointer'
  },
  badge: {
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    lineHeight: '1.4',
    marginBottom: '8px'
  }
};
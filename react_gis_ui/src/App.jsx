import React, { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { H3HexagonLayer } from '@deck.gl/geo-layers';
import { Map } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

// Insert your Stadia API Key here
const STADIA_API_KEY = "b7b66166-56ab-4599-9ad0-13a9bae45df8";
const INITIAL_VIEW_STATE = {
  longitude: 76.6394,
  latitude: 12.2958,
  zoom: 11,
  pitch: 45,
  bearing: 0
};

// Direct Stadia Dark Raster Spec using your API Key
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

// Interface 1: Realistic Citizen 1930 Intake Portal
function ReportFraud({ onComplaintSubmitted }) {
  const [formData, setFormData] = useState({
    utr_number: '',
    victim_account: '',
    beneficiary_account: '',
    amount: '',
    incident_location: 'Mysuru_Saraswathipuram',
    latitude: 12.2958,
    longitude: 76.6394,
    off_ramp_type: 'MICRO_ATM',
    hop_count: 4,
    velocity_score: 0.88
  });

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const handleLocationChange = (e) => {
    const loc = e.target.value;
    if (loc === 'Mysuru_Saraswathipuram') {
      setFormData(p => ({ ...p, incident_location: loc, latitude: 12.2958, longitude: 76.6394 }));
    } else if (loc === 'Mysuru_Kuvempunagar') {
      setFormData(p => ({ ...p, incident_location: loc, latitude: 12.2850, longitude: 76.6280 }));
    } else if (loc === 'Bengaluru_MG_Road') {
      setFormData(p => ({ ...p, incident_location: loc, latitude: 12.9716, longitude: 77.5946 }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || '' : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    const payload = {
      transaction_id: formData.utr_number || `UTR-${Math.floor(100000 + Math.random() * 900000)}`,
      source_account: formData.victim_account,
      target_account: formData.beneficiary_account,
      amount: parseFloat(formData.amount),
      timestamp: Math.floor(Date.now() / 1000),
      latitude: formData.latitude,
      longitude: formData.longitude,
      off_ramp_type: formData.off_ramp_type,
      hop_count: formData.hop_count,
      velocity_score: formData.velocity_score
    };

    try {
      const response = await fetch('http://localhost:3000/api/v1/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setStatusMessage({
          type: 'success',
          text: `Complaint Registered! Risk: ${(data.risk_score * 100).toFixed(0)}\% \vert{} Auto-Hold:${data.automated_hold_applied ? 'ACTIVE' : 'PENDING'}`
        });

        if (onComplaintSubmitted) {
          onComplaintSubmitted(data);
        }

        setFormData((prev) => ({
          ...prev,
          utr_number: '',
          victim_account: '',
          beneficiary_account: '',
          amount: ''
        }));
      } else {
        setStatusMessage({ type: 'error', text: 'Gateway failed to process report.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: `Connection Error: ${err.message}` });
    } finally {
      setLoading(false);
    }
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
          <label style={styles.label}>Suspected Cash-Out Spot</label>
          <select name="incident_location" value={formData.incident_location} onChange={handleLocationChange} style={styles.input}>
            <option value="Mysuru_Saraswathipuram">Mysuru - Saraswathipuram ATM Zone</option>
            <option value="Mysuru_Kuvempunagar">Mysuru - Kuvempunagar Hub</option>
            <option value="Bengaluru_MG_Road">Bengaluru - MG Road District</option>
          </select>
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
          {loading ? 'Processing Complaint...' : 'Register Complaint & Freeze Funds'}
        </button>
      </form>
    </div>
  );
}

// Main Command Dashboard Layout
export default function App() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/ws');
    ws.onopen = () => console.log('Connected to Go Dispatcher');
    ws.onmessage = (event) => {
      const newAlert = JSON.parse(event.data);
      setAlerts((prev) => [...prev, newAlert]);
    };
    ws.onclose = () => console.log('Disconnected from Go Dispatcher');
    return () => ws.close();
  }, []);

  const layers = [
    new H3HexagonLayer({
      id: 'h3-hexagon-layer',
      data: alerts,
      pickable: true,
      wireframe: true,
      filled: true,
      extruded: true,
      elevationScale: 15,
      coverage: 0.9,
      getHexagon: (d) => d.h3_index,
      getFillColor: (d) => d.risk_score > 0.80 ? [255, 0, 0, 200] : [255, 165, 0, 200],
      getElevation: (d) => d.risk_score * 100,
    })
  ];

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', backgroundColor: '#111' }}>
      {/* Left Panel: Live Police Command Console */}
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

      {/* Right Panel: Citizen Reporting Intake Form */}
      <ReportFraud />

      {/* Background: 3D Geospatial Map */}
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
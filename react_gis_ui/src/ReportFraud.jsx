import React, { useState } from 'react';

export default function ReportFraud({ onComplaintSubmitted }) {
    const [formData, setFormData] = useState({
        transaction_id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
        source_account: '',
        target_account: '',
        amount: '',
        latitude: 12.2958,
        longitude: 76.6394,
        off_ramp_type: 'MICRO_ATM',
        hop_count: 3,
        velocity_score: 0.85
    });

    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);

    // Use browser HTML5 Geolocation to grab victim's current position
    const handleGetLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setFormData((prev) => ({
                        ...prev,
                        latitude: parseFloat(position.coords.latitude.toFixed(4)),
                        longitude: parseFloat(position.coords.longitude.toFixed(4))
                    }));
                    setStatusMessage({ type: 'info', text: 'GPS coordinates captured successfully.' });
                },
                () => {
                    setStatusMessage({ type: 'error', text: 'Unable to retrieve GPS. Using default coordinates.' });
                }
            );
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'amount' || name === 'latitude' || name === 'longitude' || name === 'velocity_score'
                ? parseFloat(value) || ''
                : name === 'hop_count'
                    ? parseInt(value, 10) || ''
                    : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatusMessage(null);

        const payload = {
            ...formData,
            timestamp: Math.floor(Date.now() / 1000)
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
                    text: `Report Processed! Risk Score: ${data.risk_score} | H3 Zone: ${data.h3_index} | Jurisdiction: ${data.target_jurisdiction}`
                });

                // Trigger callback to notify parent views or map overlays
                if (onComplaintSubmitted) {
                    onComplaintSubmitted(data);
                }

                // Regenerate Transaction ID for next submission
                setFormData((prev) => ({
                    ...prev,
                    transaction_id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
                    source_account: '',
                    target_account: '',
                    amount: ''
                }));
            } else {
                setStatusMessage({ type: 'error', text: 'Ingestion Gateway failed to process report.' });
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
                    <label style={styles.label}>Txn ID</label>
                    <input type="text" name="transaction_id" value={formData.transaction_id} onChange={handleChange} style={styles.input} required />
                </div>

                <div style={styles.row}>
                    <label style={styles.label}>Victim Account</label>
                    <input type="text" name="source_account" placeholder="e.g. 9988-7766-5544" value={formData.source_account} onChange={handleChange} style={styles.input} required />
                </div>

                <div style={styles.row}>
                    <label style={styles.label}>Suspect/Mule ID</label>
                    <input type="text" name="target_account" placeholder="e.g. mule_account_90" value={formData.target_account} onChange={handleChange} style={styles.input} required />
                </div>

                <div style={styles.row}>
                    <label style={styles.label}>Amount (₹)</label>
                    <input type="number" name="amount" placeholder="50000" value={formData.amount} onChange={handleChange} style={styles.input} required />
                </div>

                <div style={styles.row}>
                    <label style={styles.label}>Off-Ramp Type</label>
                    <select name="off_ramp_type" value={formData.off_ramp_type} onChange={handleChange} style={styles.input}>
                        <option value="MICRO_ATM">Micro ATM</option>
                        <option value="ATM">Standard ATM</option>
                        <option value="POS_TERMINAL">POS Terminal</option>
                        <option value="CRYPTO_OFFRAMP">Crypto Off-Ramp</option>
                    </select>
                </div>

                <div style={styles.row}>
                    <label style={styles.label}>Coordinates</label>
                    <div style={{ display: 'flex', gap: '5px', flex: 1 }}>
                        <input type="number" step="0.0001" name="latitude" value={formData.latitude} onChange={handleChange} style={styles.input} placeholder="Lat" required />
                        <input type="number" step="0.0001" name="longitude" value={formData.longitude} onChange={handleChange} style={styles.input} placeholder="Lng" required />
                        <button type="button" onClick={handleGetLocation} style={styles.geoBtn} title="Use Current GPS">📍</button>
                    </div>
                </div>

                <button type="submit" disabled={loading} style={styles.submitBtn}>
                    {loading ? 'Evaluating Risk...' : 'Submit Fraud Complaint'}
                </button>
            </form>
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
    geoBtn: {
        background: '#334155',
        border: '1px solid #475569',
        borderRadius: '6px',
        color: '#fff',
        cursor: 'pointer',
        padding: '0 10px'
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
        cursor: 'pointer',
        transition: 'opacity 0.2s'
    },
    badge: {
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        lineHeight: '1.4',
        marginBottom: '8px'
    }
};
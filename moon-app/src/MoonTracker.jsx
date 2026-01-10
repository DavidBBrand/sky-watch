import React, { useState, useEffect } from 'react';
import './MoonTracker.css';

const MoonTracker = ({ lat, lon }) => {
  const [illumination, setIllumination] = useState(null);
  const [loading, setLoading] = useState(true);

  // Corrected single useEffect block
  useEffect(() => {
    setLoading(true);

    // Fetching from the details endpoint we set up in main.py
    fetch(`http://127.0.0.1:8000/moon-details?lat=${lat}&lon=${lon}`)
      .then(response => response.json())
      .then(data => {
        // We use data.illumination because that is the key in your Python return
        setIllumination(data.illumination);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching moon data:", err);
        setLoading(false);
      });
  }, [lat, lon]); 

  // --- The Graphic Sub-Component ---
  const MoonGraphic = ({ percentage }) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', width: '100%' }}>
        <div style={{
          width: '120px',
          height: '120px',
          backgroundColor: '#1a1a1a', 
          borderRadius: '50%',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid var(--card-border)',
          boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)'
        }}>
          {/* The lit portion */}
          <div style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: '#fefcd7', 
            boxShadow: 'inset -10px 0 20px rgba(0,0,0,0.3), 0 0 15px rgba(254, 252, 215, 0.4)',
            transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)' 
          }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h2 className="moon-percentage" style={{ margin: 0, color: 'var(--text-main)' }}>
            {percentage}%
          </h2>
          <p style={{ color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.7rem', margin: 0 }}>
            Illumination
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="moon-card">
      <p style={{ 
        fontSize: '0.7rem', 
        textTransform: 'uppercase', 
        letterSpacing: '2px', 
        color: 'var(--text-sub)', 
        marginBottom: '20px',
        alignSelf: 'flex-start' 
      }}>
        Lunar Phase
      </p>

      {loading ? (
        <p style={{ color: 'var(--text-main)', fontSize: '0.8rem', opacity: 0.6 }}>Updating Phase...</p>
      ) : illumination !== null ? (
        <MoonGraphic percentage={illumination} />
      ) : (
        <p style={{ color: '#ff4444', fontSize: '0.8rem' }}>Data Unavailable</p>
      )}
    </div>
  );
};

export default MoonTracker;
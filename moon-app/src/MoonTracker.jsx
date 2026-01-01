import React, { useState, useEffect } from 'react';

const MoonTracker = () => {
  const [illumination, setIllumination] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Make sure your FastAPI server is running in the background!
    fetch('http://127.0.0.1:8000/moon-illumination')
      .then(response => response.json())
      .then(data => {
        setIllumination(data.illumination);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching moon data:", err);
        setLoading(false);
      });
  }, []);

  // --- The Graphic Sub-Component ---
  const MoonGraphic = ({ percentage }) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <div style={{
          width: '200px',
          height: '200px',
          backgroundColor: '#321b1bff', // Dark Moon shadow
          borderRadius: '50%',
          position: 'relative',
          overflow: 'hidden',
          border: '2px solid #444',
          boxShadow: '0 0 50px rgba(255, 255, 255, 0.1)'
        }}>
          {/* This div represents the lit portion */}
          <div style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: '#fefcd7', // Moon glow color
            boxShadow: 'inset -20px 0 30px rgba(0,0,0,0.2)',
            transition: 'width 1s ease-in-out'
          }} />
        </div>
        <h2 style={{ color: '#fff', fontSize: '2rem', margin: 0 }}>
          {percentage}%
        </h2>
        <p style={{ color: '#888', textTransform: 'uppercase', letterSpacing: '2px' }}>
          Illumination
        </p>
      </div>
    );
  };

  // --- Main Render ---
  return (
    <div style={{
      backgroundColor: '#050505',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'sans-serif',
      
    }}>
      {loading ? (
        <p style={{ color: '#fff' }}>Querying Skyfield...</p>
      ) : illumination !== null ? (
        <MoonGraphic percentage={illumination} />
      ) : (
        <p style={{ color: '#ff4444' }}>API Error. Is the backend running?</p>
      )}
    </div>
  );
};

export default MoonTracker;
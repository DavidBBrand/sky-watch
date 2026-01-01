import { useState } from 'react'
import './App.css'
import MoonTracker from './MoonTracker.jsx'
import Weather from './Weather.jsx'

function App() {
  return (
    <div style={{ 
      backgroundColor: '#050505', 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column', // Stack the header/footer vertically
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'sans-serif'
    }}>
      {/* Title / Header */}
      <h1 style={{ color: '#fff', marginBottom: '40px', fontWeight: '200', letterSpacing: '4px' }}>
        SKY DASHBOARD
      </h1>

      {/* This is the Horizontal Row Container */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', // Align items side-by-side
        alignItems: 'center', 
        justifyContent: 'center',
        gap: '50px', // Space between the moon and the weather
        flexWrap: 'wrap' // Allows them to stack on mobile phones
      }}>
        <MoonTracker />
        <Weather />
      </div>
    </div>
  )
}
export default App

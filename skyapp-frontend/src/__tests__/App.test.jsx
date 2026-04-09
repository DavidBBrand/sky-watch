import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import App from '../App';
import '@testing-library/jest-dom';

//  Mock the system time to 12:00 PM
vi.setSystemTime(new Date('2026-04-09T12:00:00Z'));

// Mock react-leaflet entirely so it doesn't try to run map logic
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => null,
  Marker: () => null,
  Popup: () => null,
  useMap: () => ({
    setView: vi.fn(),
  }),
}));

// Mock the Esri plugin if you're using it
vi.mock('esri-leaflet', () => ({
  basemapLayer: () => ({ addTo: vi.fn() }),
}));

//  MOCK THE LOCATION CONTEXT DIRECTLY
// This stops the fetch() calls that are crashing with "Access Denied"
vi.mock('../LocationContext', () => ({
  LocationProvider: ({ children }) => <div>{children}</div>,
  useLocation: () => ({
    location: { latitude: 35.92, longitude: -86.86 },
    loading: false, // Force loading to false immediately
    error: null,
    address: 'Franklin, TN'
  }),
}));

// Mock fetch before your tests
vi.stubGlobal('fetch', vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ 
      sun: { 
        sunrise: "2026-04-09T06:22:00Z", 
        sunset: "2026-04-09T19:15:00Z",
        phase: "Full Moon" // Added to satisfy GoldenHour check
      },
      planets: {
        Mars: { altitude: "15.5", azimuth: "120.2" },
        Venus: { altitude: "-5.0", azimuth: "250.1" }
      }
    }),
  })
));

test('renders Sky Watch title and toggles theme', async () => {
  render(<App />); 

  // 1. Wait for the app to initialize and clear the loading screen
  const titleElement = await screen.findByText(/SKY WATCH/i);
  expect(titleElement).toBeInTheDocument();

  // 2. Verify initial theme is DAY (because it is 12:00 PM in our mock)
  // This proves your new solar-sync logic is working in the test!
  expect(document.documentElement.getAttribute('data-theme')).toBe('day');

  // 3. Toggle Theme to NIGHT
  const toggleBtn = screen.getByRole('button', { name: /☀️ Day Mode/i });
  fireEvent.click(toggleBtn);
  
  // 4. Verify it changed to NIGHT
  expect(document.documentElement.getAttribute('data-theme')).toBe('night');
});
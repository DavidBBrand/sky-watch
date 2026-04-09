import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import App from '../App';
import '@testing-library/jest-dom';

// 1. Mock Leaflet
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map">{children}</div>,
  TileLayer: () => null,
  Marker: () => null,
  Popup: () => null,
}));

// 2. MOCK THE LOCATION CONTEXT DIRECTLY
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
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ 
      sun: { sunrise: "2026-04-09T06:00:00Z", sunset: "2026-04-09T19:00:00Z" } 
    }),
  })
);

test('renders Sky Watch title and toggles theme', async () => {
  render(<App />); // No Provider needed because we mocked the whole module

  // Simple matcher is fine now because loading is forced to false
  const titleElement = await screen.findByText(/SKY WATCH/i);
  expect(titleElement).toBeInTheDocument();

  // Verify initial theme (Night)
  expect(document.documentElement.getAttribute('data-theme')).toBe('night');

  // Toggle Theme
  const toggleBtn = screen.getByRole('button', { name: /toggle day\/night mode/i });
  fireEvent.click(toggleBtn);
  
  // Verify change to Day
  expect(document.documentElement.getAttribute('data-theme')).toBe('day');
});
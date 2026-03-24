import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import App from '../App';
import { LocationProvider } from '../LocationContext';
import '@testing-library/jest-dom';

// This "mocks" Leaflet so it doesn't try to render real map graphics during tests
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map">{children}</div>,
  TileLayer: () => null,
  Marker: () => null,
  Popup: () => null,
}));

test('renders Sky Watch title and toggles theme', async () => { // Added 'async'
  
  // 2. Mock Geolocation to bypass the "WAITING FOR GPS" screen
  const mockGeolocation = {
    getCurrentPosition: vi.fn().mockImplementation((success) =>
      success({
        coords: {
          latitude: 35.92,
          longitude: -86.86,
        },
      })
    ),
    watchPosition: vi.fn(),
  };
  global.navigator.geolocation = mockGeolocation;

  render(
    <LocationProvider>
      <App />
    </LocationProvider>
  );

  // Check if the HUD title exists
  const titleElement = screen.getByText(/SKY WATCH/i);
  expect(titleElement).toBeInTheDocument();

  // Check Theme Toggle
// 1. Verify it starts as Night (Default)
  expect(document.documentElement.getAttribute('data-theme')).toBe('night');

  // 2. Click the Toggle
  const toggleBtn = screen.getByRole('button', { name: /toggle day\/night mode/i });
  fireEvent.click(toggleBtn);
  
  // 3. Verify it changed to Day
  expect(document.documentElement.getAttribute('data-theme')).toBe('day');
});
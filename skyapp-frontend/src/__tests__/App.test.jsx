import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import App from '../App';
import { LocationProvider } from '../LocationContext';
import '@testing-library/jest-dom';

// 1. Mock Leaflet
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map">{children}</div>,
  TileLayer: () => null,
  Marker: () => null,
  Popup: () => null,
}));

// 2. Mock the entire Geolocation API before rendering
const mockGeolocation = {
  getCurrentPosition: vi.fn().mockImplementation((success) =>
    success({ coords: { latitude: 35.92, longitude: -86.86 } })
  ),
  watchPosition: vi.fn().mockImplementation((success) =>
    success({ coords: { latitude: 35.92, longitude: -86.86 } })
  ),
};
vi.stubGlobal('navigator', { geolocation: mockGeolocation });

test('renders Sky Watch title and toggles theme', async () => {
  render(
    <LocationProvider>
      <App />
    </LocationProvider>
  );

  // 3. Flex the text matcher
  // Sometimes "SKY WATCH" is rendered as <span>SKY</span> WATCH
  // Using a function matcher bypasses "broken up text" issues
  const titleElement = await screen.findByText((content, element) => {
    return element.tagName.toLowerCase() === 'div' && content.includes('SKY WATCH');
  }, {}, { timeout: 3000 }); // Increase timeout to 3 seconds

  expect(titleElement).toBeInTheDocument();

  // 4. Verify initial theme (Night)
  expect(document.documentElement.getAttribute('data-theme')).toBe('night');

  // 5. Toggle Theme
  const toggleBtn = screen.getByRole('button', { name: /toggle day\/night mode/i });
  fireEvent.click(toggleBtn);
  
  expect(document.documentElement.getAttribute('data-theme')).toBe('day');
});
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test } from 'vitest';
import App from '../App';
import { LocationProvider } from '../LocationContext';
import { vi } from 'vitest';
import '@testing-library/jest-dom';

// This "mocks" Leaflet so it doesn't try to render real map graphics during tests
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map">{children}</div>,
  TileLayer: () => null,
  Marker: () => null,
  Popup: () => null,
}));

test('renders Sky Watch title and toggles theme', () => {
  render(
    <LocationProvider>
      <App />
    </LocationProvider>
  );

  // Check if the HUD title exists
  const titleElement = screen.getByText(/SKY WATCH/i);
  expect(titleElement).toBeInTheDocument();

  // Check Theme Toggle

  const toggleBtn = screen.getByRole('button', { name: /mode/i });
  fireEvent.click(toggleBtn);
  
  // Verify if data-theme attribute changes on the document
  expect(document.documentElement.getAttribute('data-theme')).toBe('day');
});
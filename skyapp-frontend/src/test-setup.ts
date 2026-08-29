// Polyfill ResizeObserver for jsdom (not implemented in the test environment)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Polyfill Worker for jsdom (Web Workers are not available in the test environment)
global.Worker = class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: ErrorEvent) => void) | null = null;
  postMessage() {}
  terminate() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return false; }
} as unknown as typeof Worker;

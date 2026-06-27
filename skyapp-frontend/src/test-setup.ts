// Polyfill ResizeObserver for jsdom (not implemented in the test environment)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

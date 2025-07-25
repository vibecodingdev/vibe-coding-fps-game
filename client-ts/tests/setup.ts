import "jest-environment-jsdom";

// Global test setup
global.console = {
  ...console,
  // Suppress console.log in tests unless needed
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock DOM APIs that might not be available in test environment
Object.defineProperty(window, "requestAnimationFrame", {
  writable: true,
  value: jest.fn((cb) => setTimeout(cb, 16)),
});

Object.defineProperty(window, "cancelAnimationFrame", {
  writable: true,
  value: jest.fn(),
});

// Mock WebGL context
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  drawingBufferWidth: 1024,
  drawingBufferHeight: 768,
  viewport: jest.fn(),
  clear: jest.fn(),
  clearColor: jest.fn(),
  enable: jest.fn(),
  disable: jest.fn(),
  getParameter: jest.fn(() => ""),
  createShader: jest.fn(() => ({})),
  shaderSource: jest.fn(),
  compileShader: jest.fn(),
  getShaderParameter: jest.fn(() => true),
  createProgram: jest.fn(() => ({})),
  attachShader: jest.fn(),
  linkProgram: jest.fn(),
  getProgramParameter: jest.fn(() => true),
  useProgram: jest.fn(),
  createBuffer: jest.fn(() => ({})),
  bindBuffer: jest.fn(),
  bufferData: jest.fn(),
  enableVertexAttribArray: jest.fn(),
  vertexAttribPointer: jest.fn(),
  drawArrays: jest.fn(),
  createTexture: jest.fn(() => ({})),
  bindTexture: jest.fn(),
  texImage2D: jest.fn(),
  texParameteri: jest.fn(),
  generateMipmap: jest.fn(),
}));

// Mock AudioContext
global.AudioContext = jest.fn(() => ({
  createGain: jest.fn(() => ({ gain: { value: 1 } })),
  createBufferSource: jest.fn(() => ({
    buffer: null,
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  })),
  decodeAudioData: jest.fn(() => Promise.resolve({})),
  destination: {},
})) as any;

// Mock pointer lock API
Object.defineProperty(document, "pointerLockElement", {
  writable: true,
  value: null,
});

Object.defineProperty(document.body, "requestPointerLock", {
  writable: true,
  value: jest.fn(),
});

// Mock performance API
Object.defineProperty(global, "performance", {
  writable: true,
  value: {
    now: jest.fn(() => Date.now()),
  },
});

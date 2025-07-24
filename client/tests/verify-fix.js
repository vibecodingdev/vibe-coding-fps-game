// Verification script for Three.js geometry compatibility
console.log("🔧 Verifying Three.js compatibility...");

// Test CylinderGeometry (our fix)
try {
  const cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
  console.log("✅ CylinderGeometry works correctly");
} catch (error) {
  console.error("❌ CylinderGeometry failed:", error.message);
}

// Test other commonly used geometries
const geometryTests = [
  { name: "BoxGeometry", constructor: () => new THREE.BoxGeometry(1, 1, 1) },
  {
    name: "SphereGeometry",
    constructor: () => new THREE.SphereGeometry(0.5, 8, 8),
  },
  { name: "PlaneGeometry", constructor: () => new THREE.PlaneGeometry(1, 1) },
  {
    name: "ConeGeometry",
    constructor: () => new THREE.ConeGeometry(0.5, 1, 8),
  },
];

geometryTests.forEach((test) => {
  try {
    const geometry = test.constructor();
    console.log(`✅ ${test.name} works correctly`);
    geometry.dispose(); // Clean up
  } catch (error) {
    console.error(`❌ ${test.name} failed:`, error.message);
  }
});

// Test CanvasTexture
try {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ff0000";
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  console.log("✅ CanvasTexture works correctly");
} catch (error) {
  console.error("❌ CanvasTexture failed:", error.message);
}

console.log("🎯 Three.js compatibility verification complete");

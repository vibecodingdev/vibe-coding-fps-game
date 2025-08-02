"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { MonsterConfig } from "@/types/monster";

interface MonsterPreview3DProps {
  monster: MonsterConfig;
  width?: number;
  height?: number;
}

export default function MonsterPreview3D({
  monster,
  width = 300,
  height = 300,
}: MonsterPreview3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mouse interaction state
  const mouseRef = useRef({ x: 0, y: 0, isDown: false });
  const rotationRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!canvasRef.current) return;

    initializeThreeJS();
    createDemonModel();
    startAnimation();

    return () => {
      cleanup();
    };
  }, [monster]);

  const initializeThreeJS = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      // Initialize scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0a0a);
      sceneRef.current = scene;

      // Initialize camera
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(0, 1, 3);
      cameraRef.current = camera;

      // Initialize renderer
      const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true,
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      rendererRef.current = renderer;

      // Setup lighting
      setupLighting(scene);

      setError(null);
    } catch (err) {
      console.error("Failed to initialize Three.js:", err);
      setError("Failed to initialize 3D preview");
    }
  };

  const setupLighting = (scene: THREE.Scene) => {
    // Main directional light
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(2, 4, 2);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0x4444ff, 0.4);
    fillLight.position.set(-2, 2, -1);
    scene.add(fillLight);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x333333, 0.3);
    scene.add(ambientLight);

    // Gaming-style rim light
    const rimLight = new THREE.DirectionalLight(0xff6600, 0.8);
    rimLight.position.set(-1, 1, -2);
    scene.add(rimLight);
  };

  const createDemonModel = () => {
    const scene = sceneRef.current;
    if (!scene) return;

    try {
      // Remove existing model
      if (modelRef.current) {
        scene.remove(modelRef.current);
      }

      const demonGroup = new THREE.Group();
      const colors = monster.colors;

      // Create materials with gaming-style effects
      const bodyMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colors.primary || "#ff0000"),
        emissive: new THREE.Color(colors.primary || "#ff0000"),
        emissiveIntensity: 0.1,
        metalness: 0.2,
        roughness: 0.7,
      });

      const headMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colors.head || "#ff0000"),
        emissive: new THREE.Color(colors.head || "#ff0000"),
        emissiveIntensity: 0.15,
        metalness: 0.3,
        roughness: 0.6,
      });

      // Create body based on body type - matching client-ts DemonSystem implementation
      const bodyType = monster.appearance?.bodyType || "humanoid";
      let bodyGeometry: THREE.BufferGeometry;

      switch (bodyType) {
        case "floating":
          // Floating demons like Cacodemon: Large sphere
          bodyGeometry = new THREE.SphereGeometry(0.8, 16, 12);
          break;
        case "dragon":
          // Dragon: Tall imposing figure
          bodyGeometry = new THREE.CylinderGeometry(0.4, 0.5, 1.6, 12);
          break;
        case "quadruped":
          // Quadruped: Horizontal body
          bodyGeometry = new THREE.BoxGeometry(1.2, 0.6, 0.8);
          break;
        case "small_biped":
          // Small biped: Compact cylindrical body
          bodyGeometry = new THREE.CylinderGeometry(0.2, 0.3, 1.0, 8);
          break;
        case "humanoid":
        default:
          // Humanoid: More muscular torso like client-ts
          bodyGeometry = new THREE.CylinderGeometry(0.25, 0.35, 1.2, 8);
          break;
      }

      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = bodyType === "floating" ? 1.0 : 0.6;
      body.castShadow = true;
      body.receiveShadow = true;
      demonGroup.add(body);

      // Create head - matching client-ts DemonSystem implementation
      let headGeometry: THREE.BufferGeometry;
      if (bodyType === "floating") {
        // Floating demons: Small head on top of sphere
        headGeometry = new THREE.SphereGeometry(0.3, 12, 8);
      } else if (bodyType === "dragon") {
        // Dragon: Angular, menacing head
        headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      } else {
        // Humanoid/small_biped: Rounded but angular
        headGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.4, 8);
      }

      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = bodyType === "floating" ? 1.5 : 1.4;
      head.castShadow = true;
      head.receiveShadow = true;
      demonGroup.add(head);

      // Add glowing eyes
      const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
      const eyeMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colors.eyes || "#ffff00"),
        emissive: new THREE.Color(colors.eyes || "#ffff00"),
        emissiveIntensity: 1.0,
        metalness: 0.1,
        roughness: 0.3,
      });

      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial.clone());

      // Position eyes based on body type - matching client-ts positioning
      if (bodyType === "floating") {
        leftEye.position.set(-0.15, head.position.y + 0.05, 0.25);
        rightEye.position.set(0.15, head.position.y + 0.05, 0.25);
      } else {
        leftEye.position.set(-0.1, head.position.y + 0.05, 0.3);
        rightEye.position.set(0.1, head.position.y + 0.05, 0.3);
      }

      demonGroup.add(leftEye);
      demonGroup.add(rightEye);

      // Add basic limbs for humanoid and small_biped types (matching client-ts)
      if (bodyType === "humanoid" || bodyType === "small_biped") {
        addBasicLimbs(demonGroup, monster, bodyMaterial);
      }

      // Add visual features
      addVisualFeatures(demonGroup, monster, bodyMaterial);

      // Scale the model
      const scale = monster.scale || 1.0;
      demonGroup.scale.setScalar(scale);

      // Store reference and add to scene
      modelRef.current = demonGroup;
      scene.add(demonGroup);

      setIsLoading(false);
    } catch (err) {
      console.error("Failed to create demon model:", err);
      setError("Failed to create 3D model");
      setIsLoading(false);
    }
  };

  const addBasicLimbs = (
    demonGroup: THREE.Group,
    monster: MonsterConfig,
    baseMaterial: THREE.Material
  ) => {
    const bodyType = monster.appearance?.bodyType || "humanoid";
    const features = monster.appearance?.visualFeatures;

    // Create arm material - matching client-ts
    const armMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(monster.colors.head || "#ff0000"),
      emissive: new THREE.Color(monster.colors.head || "#ff0000"),
      emissiveIntensity: 0.1,
      metalness: 0.2,
      roughness: 0.7,
    });

    // Create leg material - matching client-ts
    const legMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(monster.colors.primary || "#ff0000"),
      emissive: new THREE.Color(monster.colors.primary || "#ff0000"),
      emissiveIntensity: 0.1,
      metalness: 0.2,
      roughness: 0.7,
    });

    // Add arms
    const armGeometry =
      bodyType === "small_biped"
        ? new THREE.CylinderGeometry(0.06, 0.08, 0.4, 6)
        : new THREE.CylinderGeometry(0.06, 0.1, 0.7, 6);

    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);

    if (bodyType === "small_biped") {
      leftArm.position.set(-0.25, 0.5, 0);
      rightArm.position.set(0.25, 0.5, 0);
      leftArm.rotation.z = 0.2;
      rightArm.rotation.z = -0.2;
    } else {
      leftArm.position.set(-0.45, 0.8, 0);
      rightArm.position.set(0.45, 0.8, 0);
      leftArm.rotation.z = 0.3;
      rightArm.rotation.z = -0.3;
    }

    leftArm.castShadow = true;
    rightArm.castShadow = true;
    demonGroup.add(leftArm);
    demonGroup.add(rightArm);

    // Add legs
    const legGeometry =
      bodyType === "small_biped"
        ? new THREE.CylinderGeometry(0.1, 0.12, 0.5, 6)
        : new THREE.CylinderGeometry(0.1, 0.12, 0.8, 6);

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);

    if (bodyType === "small_biped") {
      leftLeg.position.set(-0.15, -0.25, 0);
      rightLeg.position.set(0.15, -0.25, 0);
    } else {
      leftLeg.position.set(-0.2, -0.4, 0);
      rightLeg.position.set(0.2, -0.4, 0);
    }

    leftLeg.castShadow = true;
    rightLeg.castShadow = true;
    demonGroup.add(leftLeg);
    demonGroup.add(rightLeg);

    // Add claws if specified - matching client-ts implementation
    if (features?.hasClaws) {
      const clawGeometry = new THREE.ConeGeometry(0.03, 0.15, 6);
      const clawMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color("#222222"),
        metalness: 0.6,
        roughness: 0.3,
      });

      for (let side = 0; side < 2; side++) {
        const armSide = side === 0 ? -1 : 1;
        for (let i = 0; i < 3; i++) {
          const claw = new THREE.Mesh(clawGeometry, clawMaterial);
          const xPos = bodyType === "small_biped" ? 0.25 : 0.45;
          const yPos = bodyType === "small_biped" ? 0.3 : 0.4;

          claw.position.set(armSide * xPos + (i - 1) * 0.05, yPos, 0.1);
          claw.rotation.x = Math.PI;
          claw.castShadow = true;
          demonGroup.add(claw);
        }
      }
    }

    // Add hooves for humanoid demons - matching client-ts
    if (bodyType === "humanoid") {
      const hoofGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.2);
      const hoofMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color("#333333"),
        metalness: 0.3,
        roughness: 0.8,
      });

      const leftHoof = new THREE.Mesh(hoofGeometry, hoofMaterial);
      const rightHoof = new THREE.Mesh(hoofGeometry, hoofMaterial);

      leftHoof.position.set(-0.2, -0.84, 0.05);
      rightHoof.position.set(0.2, -0.84, 0.05);

      leftHoof.castShadow = true;
      rightHoof.castShadow = true;
      demonGroup.add(leftHoof);
      demonGroup.add(rightHoof);
    }
  };

  const addVisualFeatures = (
    demonGroup: THREE.Group,
    monster: MonsterConfig,
    baseMaterial: THREE.Material
  ) => {
    const features = monster.appearance.visualFeatures;
    if (!features) return;

    const accentMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(
        monster.colors.accent || monster.colors.secondary || "#ff8800"
      ),
      emissive: new THREE.Color(monster.colors.accent || "#ff4400"),
      emissiveIntensity: 0.2,
      metalness: 0.4,
      roughness: 0.5,
    });

    // Add wings - improved to match client-ts style
    if (features.hasWings) {
      const bodyType = monster.appearance?.bodyType || "humanoid";

      if (bodyType === "dragon") {
        // Dragon wings: More angular, like client-ts dragon features
        const wingGeometry = new THREE.CylinderGeometry(0.05, 0.3, 1.2, 8);
        const leftWing = new THREE.Mesh(wingGeometry, accentMaterial);
        const rightWing = new THREE.Mesh(wingGeometry, accentMaterial);

        leftWing.position.set(-0.8, 1.0, -0.2);
        rightWing.position.set(0.8, 1.0, -0.2);
        leftWing.rotation.z = Math.PI / 4;
        leftWing.rotation.x = -Math.PI / 6;
        rightWing.rotation.z = -Math.PI / 4;
        rightWing.rotation.x = -Math.PI / 6;

        leftWing.castShadow = true;
        rightWing.castShadow = true;
        demonGroup.add(leftWing);
        demonGroup.add(rightWing);
      } else {
        // Standard wings: Plane geometry
        const wingGeometry = new THREE.PlaneGeometry(0.8, 0.4);
        const leftWing = new THREE.Mesh(wingGeometry, accentMaterial);
        const rightWing = new THREE.Mesh(wingGeometry, accentMaterial);

        leftWing.position.set(-0.6, 1.2, -0.2);
        rightWing.position.set(0.6, 1.2, -0.2);
        leftWing.rotation.z = 0.3;
        rightWing.rotation.z = -0.3;

        leftWing.castShadow = true;
        rightWing.castShadow = true;
        demonGroup.add(leftWing);
        demonGroup.add(rightWing);
      }
    }

    // Add horns
    if (features.hasHorns) {
      const hornGeometry = new THREE.ConeGeometry(0.05, 0.3, 6);
      const leftHorn = new THREE.Mesh(hornGeometry, accentMaterial);
      const rightHorn = new THREE.Mesh(hornGeometry, accentMaterial);

      leftHorn.position.set(-0.15, 1.6, 0);
      rightHorn.position.set(0.15, 1.6, 0);

      leftHorn.castShadow = true;
      rightHorn.castShadow = true;
      demonGroup.add(leftHorn);
      demonGroup.add(rightHorn);
    }

    // Add tail
    if (features.hasTail) {
      const tailGeometry = new THREE.CylinderGeometry(0.05, 0.02, 0.8, 6);
      const tail = new THREE.Mesh(tailGeometry, accentMaterial);
      tail.position.set(0, 0.4, -0.4);
      tail.rotation.x = 0.5;
      tail.castShadow = true;
      demonGroup.add(tail);
    }

    // Add spikes
    if (features.hasSpikes) {
      for (let i = 0; i < 5; i++) {
        const spikeGeometry = new THREE.ConeGeometry(0.03, 0.15, 4);
        const spike = new THREE.Mesh(spikeGeometry, accentMaterial);
        const angle = (i / 5) * Math.PI * 2;
        spike.position.set(
          Math.cos(angle) * 0.3,
          1.0 + Math.random() * 0.4,
          Math.sin(angle) * 0.3
        );
        spike.castShadow = true;
        demonGroup.add(spike);
      }
    }
  };

  const startAnimation = () => {
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      const model = modelRef.current;

      if (!renderer || !scene || !camera) return;

      // Auto rotation when not interacting
      if (model && !mouseRef.current.isDown) {
        model.rotation.y += 0.005;
      }

      // Apply manual rotation
      if (model) {
        model.rotation.x = rotationRef.current.x;
        model.rotation.y += rotationRef.current.y;
      }

      renderer.render(scene, camera);
    };

    animate();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    mouseRef.current.isDown = true;
    mouseRef.current.x = e.clientX;
    mouseRef.current.y = e.clientY;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!mouseRef.current.isDown) return;

    const deltaX = e.clientX - mouseRef.current.x;
    const deltaY = e.clientY - mouseRef.current.y;

    rotationRef.current.x += deltaY * 0.01;
    rotationRef.current.y += deltaX * 0.01;

    // Clamp vertical rotation
    rotationRef.current.x = Math.max(
      -Math.PI / 2,
      Math.min(Math.PI / 2, rotationRef.current.x)
    );

    mouseRef.current.x = e.clientX;
    mouseRef.current.y = e.clientY;
  };

  const handleMouseUp = () => {
    mouseRef.current.isDown = false;
  };

  const cleanup = () => {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }

    if (rendererRef.current) {
      rendererRef.current.dispose();
    }

    if (sceneRef.current) {
      sceneRef.current.clear();
    }
  };

  return (
    <div className="relative bg-gaming-bg-primary rounded border border-gaming-border overflow-hidden">
      {/* Header */}
      <div className="bg-gaming-bg-tertiary px-3 py-2 border-b border-gaming-border">
        <h4 className="text-gaming-primary font-gaming text-sm uppercase tracking-wide">
          🎭 3D Model Preview
        </h4>
      </div>

      {/* Canvas Container */}
      <div
        className="relative select-none"
        style={{ width: width, height: height }}
      >
        <canvas
          ref={canvasRef}
          className="block cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-gaming-bg-primary/80 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-gaming-primary border-t-transparent rounded-full animate-spin mb-2"></div>
            <span className="text-gaming-text-muted text-xs font-gaming">
              Loading 3D Model...
            </span>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 bg-gaming-bg-primary/80 flex flex-col items-center justify-center">
            <span className="text-gaming-danger text-xs font-gaming text-center px-4">
              ❌ {error}
            </span>
          </div>
        )}

        {/* Controls Hint */}
        {!isLoading && !error && (
          <div className="absolute bottom-2 left-2 text-xs text-gaming-text-muted font-gaming opacity-60">
            Drag to rotate
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="bg-gaming-bg-tertiary px-3 py-2 border-t border-gaming-border">
        <div className="flex justify-between items-center text-xs font-gaming">
          <span className="text-gaming-text-muted">
            {monster.appearance.bodyType} • Scale: {monster.scale || 1.0}
          </span>
          <div className="flex space-x-1">
            <div
              className="w-3 h-3 rounded-full border border-gaming-border"
              style={{ backgroundColor: monster.colors.primary }}
              title="Primary Color"
            />
            <div
              className="w-3 h-3 rounded-full border border-gaming-border"
              style={{ backgroundColor: monster.colors.eyes }}
              title="Eye Color"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

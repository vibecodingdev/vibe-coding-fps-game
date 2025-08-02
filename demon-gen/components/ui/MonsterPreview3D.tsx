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

      // Create body based on body type
      const bodyType = monster.appearance?.bodyType || "humanoid";
      let bodyGeometry: THREE.BufferGeometry;

      switch (bodyType) {
        case "floating":
          bodyGeometry = new THREE.SphereGeometry(0.8, 16, 12);
          break;
        case "dragon":
          bodyGeometry = new THREE.CylinderGeometry(0.3, 0.6, 1.8, 8);
          break;
        case "quadruped":
          bodyGeometry = new THREE.BoxGeometry(1.2, 0.6, 0.8);
          break;
        case "small_biped":
          bodyGeometry = new THREE.CylinderGeometry(0.2, 0.3, 1.0, 8);
          break;
        case "humanoid":
        default:
          bodyGeometry = new THREE.CylinderGeometry(0.25, 0.35, 1.2, 8);
          break;
      }

      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = bodyType === "floating" ? 1.0 : 0.6;
      body.castShadow = true;
      body.receiveShadow = true;
      demonGroup.add(body);

      // Create head
      let headGeometry: THREE.BufferGeometry;
      if (bodyType === "floating") {
        headGeometry = new THREE.SphereGeometry(0.3, 12, 8);
      } else if (bodyType === "dragon") {
        headGeometry = new THREE.ConeGeometry(0.3, 0.6, 8);
      } else {
        headGeometry = new THREE.SphereGeometry(0.25, 12, 8);
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

      leftEye.position.set(-0.1, head.position.y + 0.05, 0.2);
      rightEye.position.set(0.1, head.position.y + 0.05, 0.2);

      demonGroup.add(leftEye);
      demonGroup.add(rightEye);

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

    // Add wings
    if (features.hasWings) {
      const wingGeometry = new THREE.PlaneGeometry(0.8, 0.4);
      const leftWing = new THREE.Mesh(wingGeometry, accentMaterial);
      const rightWing = new THREE.Mesh(wingGeometry, accentMaterial);

      leftWing.position.set(-0.6, 1.2, -0.2);
      rightWing.position.set(0.6, 1.2, -0.2);
      leftWing.rotation.z = 0.3;
      rightWing.rotation.z = -0.3;

      demonGroup.add(leftWing);
      demonGroup.add(rightWing);
    }

    // Add horns
    if (features.hasHorns) {
      const hornGeometry = new THREE.ConeGeometry(0.05, 0.3, 6);
      const leftHorn = new THREE.Mesh(hornGeometry, accentMaterial);
      const rightHorn = new THREE.Mesh(hornGeometry, accentMaterial);

      leftHorn.position.set(-0.15, 1.6, 0);
      rightHorn.position.set(0.15, 1.6, 0);

      demonGroup.add(leftHorn);
      demonGroup.add(rightHorn);
    }

    // Add tail
    if (features.hasTail) {
      const tailGeometry = new THREE.CylinderGeometry(0.05, 0.02, 0.8, 6);
      const tail = new THREE.Mesh(tailGeometry, accentMaterial);
      tail.position.set(0, 0.4, -0.4);
      tail.rotation.x = 0.5;
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

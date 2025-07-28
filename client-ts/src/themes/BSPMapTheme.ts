import * as THREE from "three";
import { BaseSceneTheme, SceneThemeConfig } from "../core/SceneTheme";

// BSP Data structures (based on bspview)
interface BSPHeader {
  id: number;
  lumps: { [key: string]: BSPLump };
}

interface BSPLump {
  name: string;
  offset: number;
  size: number;
}

interface BSPFace {
  plane: number;
  side: number;
  firstEdge: number;
  edges: number;
  textureInfo: number;
  lightmapOffset: number;
}

interface BSPNode {
  plane: number;
  front: number;
  back: number;
  bbox: [THREE.Vector3, THREE.Vector3];
  face: number;
  faces: number;
}

interface BSPLeaf {
  type: number;
  vislist: number;
  bbox: [THREE.Vector3, THREE.Vector3];
  face: number;
  faces: number;
  ambient: number[];
}

interface BSPTexture {
  name: string;
  width: number;
  height: number;
  offset1: number;
  offset2: number;
  offset4: number;
  offset8: number;
  globalOffset?: number;
}

interface BSPModel {
  min: number[];
  max: number[];
  origin: number[];
  nodes: number[];
  visLeafs: number;
  firstFace: number;
  faces: number;
}

export class BSPMapTheme extends BaseSceneTheme {
  private bspData: any = null;
  private bspMesh: THREE.Object3D | null = null;
  private loadedMapName: string = "";
  private textures: { [key: string]: THREE.Texture } = {};

  // Scale and offset parameters for coordinate system compatibility
  private readonly GAME_BOUNDARY_SIZE = 90; // Match SceneManager's BOUNDARY_SIZE
  private readonly GAME_GROUND_HEIGHT = 1.6; // Match PlayerController's GROUND_HEIGHT
  private BSP_SCALE_FACTOR = 0.2; // Scale down BSP coordinates significantly (will be calculated)
  private BSP_Y_OFFSET = 0; // Y offset to align ground levels (will be calculated)
  private readonly PLAYER_HEIGHT_BOOST = -100; // Additional height to place player on map surface
  private mapBounds: { min: THREE.Vector3; max: THREE.Vector3 } | null = null;

  constructor(scene: THREE.Scene) {
    const config: SceneThemeConfig = {
      name: "BSP Map",
      primaryColor: 0x606060, // Neutral gray
      secondaryColor: 0x707070, // Lighter gray
      fogColor: 0x404040, // Dark fog
      ambientLightColor: 0x888888, // Bright ambient
      directionalLightColor: 0xffffff, // White directional
      fillLightColor: 0xcccccc, // Bright fill
      groundColor: 0x555555, // Concrete-like floor
      skyColor: 0x87ceeb, // Sky blue for outdoor maps
      glowColor: 0x00ffff, // Cyan glow
      accentColor: 0xff8800, // Orange accents
    };
    super(scene, config);
  }

  /**
   * Load a BSP map from URL or file
   */
  async loadBSPMap(mapUrl: string): Promise<void> {
    try {
      console.log(`🗺️ Loading BSP map: ${mapUrl}`);
      console.log(`📂 Full URL: ${window.location.origin}/${mapUrl}`);

      const response = await fetch(mapUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch BSP map: ${response.status} ${response.statusText}`
        );
      }

      const buffer = await response.arrayBuffer();
      console.log(`📦 BSP file size: ${buffer.byteLength} bytes`);

      this.parseBSPData(buffer);
      this.loadedMapName = mapUrl.split("/").pop() || "unknown";

      console.log(`✅ BSP map loaded successfully: ${this.loadedMapName}`);
      console.log(`📊 Parsed vertices: ${this.bspData?.vertices?.length || 0}`);
      console.log(`📊 Parsed faces: ${this.bspData?.faces?.length || 0}`);

      // Check if we need to load associated WAD files
      await this.checkForWADFiles(mapUrl);
    } catch (error) {
      console.error("❌ Failed to load BSP map:", error);
      console.log("🔄 Falling back to default geometry");
      // Fallback to default geometry
      this.createFallbackGeometry();
    }
  }

  /**
   * Check for and attempt to load WAD texture files
   */
  private async checkForWADFiles(mapUrl: string): Promise<void> {
    // Extract map name for potential WAD file detection
    const mapName = mapUrl.split("/").pop()?.replace(".bsp", "") || "unknown";

    // Common WAD files for different map types
    const potentialWADs = [
      "halflife.wad",
      "liquids.wad",
      "xeno.wad",
      "decals.wad",
      `${mapName}.wad`,
    ];

    console.log(`🎨 Checking for WAD files for map: ${mapName}`);
    console.log(`🎨 Potential WADs: ${potentialWADs.join(", ")}`);

    // Try to load WAD files
    for (const wadFile of potentialWADs) {
      try {
        const wadPath = `maps/wad/${wadFile}`;
        console.log(`🎨 Attempting to load WAD: ${wadPath}`);

        const response = await fetch(wadPath);
        if (response.ok) {
          const buffer = await response.arrayBuffer();
          console.log(
            `✅ Found WAD file: ${wadFile} (${buffer.byteLength} bytes)`
          );
          // TODO: Parse WAD file and extract textures
          this.createProceduralTextures();
          return;
        }
      } catch (error) {
        console.log(`⚠️ WAD file ${wadFile} not found`);
      }
    }

    console.log("⚠️ No WAD files found - using procedural textures");
    this.createProceduralTextures();
  }

  /**
   * Create procedural textures as fallback when WAD files are not available
   */
  private createProceduralTextures(): void {
    console.log("🎨 Creating procedural textures...");

    // Create various textures for different surface types
    this.textures = {
      wall: this.createBrickTexture(),
      floor: this.createConcreteTexture(),
      ceiling: this.createMetalTexture(),
      liquid: this.createWaterTexture(),
      default: this.createDefaultTexture(),
    };

    console.log("✅ Procedural textures created");
  }

  private createBrickTexture(): THREE.Texture {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;

    // Create brick pattern
    ctx.fillStyle = "#8B4513"; // Brown base
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = "#A0522D"; // Lighter brown for bricks
    const brickWidth = 64;
    const brickHeight = 32;

    for (let y = 0; y < 256; y += brickHeight) {
      for (let x = 0; x < 256; x += brickWidth) {
        const offsetX = (y / brickHeight) % 2 === 0 ? 0 : brickWidth / 2;
        ctx.fillRect(x + offsetX, y, brickWidth - 2, brickHeight - 2);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
  }

  private createConcreteTexture(): THREE.Texture {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;

    // Create concrete pattern
    ctx.fillStyle = "#696969"; // Gray base
    ctx.fillRect(0, 0, 256, 256);

    // Add noise for concrete texture
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const brightness = Math.random() * 50 - 25;
      const gray = 105 + brightness;
      ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
      ctx.fillRect(x, y, 2, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  private createMetalTexture(): THREE.Texture {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;

    // Create metal pattern
    const gradient = ctx.createLinearGradient(0, 0, 256, 256);
    gradient.addColorStop(0, "#C0C0C0");
    gradient.addColorStop(0.5, "#808080");
    gradient.addColorStop(1, "#696969");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    // Add metal lines
    ctx.strokeStyle = "#A0A0A0";
    ctx.lineWidth = 1;
    for (let i = 0; i < 256; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    return texture;
  }

  private createWaterTexture(): THREE.Texture {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;

    // Create water pattern
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, "#4169E1");
    gradient.addColorStop(0.5, "#1E90FF");
    gradient.addColorStop(1, "#191970");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    return texture;
  }

  private createDefaultTexture(): THREE.Texture {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;

    // Create checkerboard pattern
    const size = 16;
    for (let x = 0; x < 64; x += size) {
      for (let y = 0; y < 64; y += size) {
        ctx.fillStyle = ((x + y) / size) % 2 === 0 ? "#FF00FF" : "#000000";
        ctx.fillRect(x, y, size, size);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);
    return texture;
  }

  private parseBSPData(buffer: ArrayBuffer): void {
    // Simplified BSP parser based on bspview implementation
    const view = new DataView(buffer);

    // Read BSP header
    const version = view.getInt32(0, true);
    console.log(`BSP Version: ${version}`);

    if (version !== 30) {
      throw new Error(`Unsupported BSP version: ${version}`);
    }

    // Parse lump directory (15 lumps for BSP30)
    const lumps: BSPLump[] = [];
    for (let i = 0; i < 15; i++) {
      const offset = 4 + i * 8;
      lumps.push({
        name: this.getLumpName(i),
        offset: view.getInt32(offset, true),
        size: view.getInt32(offset + 4, true),
      });
    }

    // Store parsed data - parse all necessary data for proper face construction
    this.bspData = {
      version,
      lumps,
      buffer,
      vertices: lumps[3] ? this.parseVertices(buffer, lumps[3]) : [], // VERTICES lump
      faces: lumps[7] ? this.parseFaces(buffer, lumps[7]) : [], // FACES lump
      edges: lumps[12] ? this.parseEdges(buffer, lumps[12]) : [], // EDGES lump
      surfEdges: lumps[13] ? this.parseSurfEdges(buffer, lumps[13]) : [], // SURFEDGES lump
      textures: lumps[2] ? this.parseTextures(buffer, lumps[2]) : [], // TEXTURES lump
      models: lumps[14] ? this.parseModels(buffer, lumps[14]) : [], // MODELS lump
      nodes: lumps[5] ? this.parseNodes(buffer, lumps[5]) : [], // NODES lump
      leaves: lumps[10] ? this.parseLeaves(buffer, lumps[10]) : [], // LEAVES lump
    };

    this.createBSPMesh();
  }

  private getLumpName(index: number): string {
    const lumpNames = [
      "ENTITIES",
      "PLANES",
      "TEXTURES",
      "VERTICES",
      "VISIBILITY",
      "NODES",
      "TEXINFO",
      "FACES",
      "LIGHTING",
      "CLIPNODES",
      "LEAVES",
      "MARKSURFACES",
      "EDGES",
      "SURFEDGES",
      "MODELS",
    ];
    return lumpNames[index] || `UNKNOWN_${index}`;
  }

  private parseVertices(buffer: ArrayBuffer, lump: BSPLump): THREE.Vector3[] {
    const view = new DataView(buffer, lump.offset, lump.size);
    const vertices: THREE.Vector3[] = [];
    const count = lump.size / 12; // 3 floats per vertex

    for (let i = 0; i < count; i++) {
      const offset = i * 12;
      const x = view.getFloat32(offset, true);
      const y = view.getFloat32(offset + 4, true);
      const z = view.getFloat32(offset + 8, true);

      // Store vertices in original Quake coordinate system
      // Transformation will be applied during face creation
      vertices.push(new THREE.Vector3(x, y, z));
    }

    return vertices;
  }

  private parseFaces(buffer: ArrayBuffer, lump: BSPLump): BSPFace[] {
    const view = new DataView(buffer, lump.offset, lump.size);
    const faces: BSPFace[] = [];
    const count = lump.size / 20; // 20 bytes per face

    for (let i = 0; i < count; i++) {
      const offset = i * 20;
      faces.push({
        plane: view.getInt16(offset, true),
        side: view.getInt16(offset + 2, true),
        firstEdge: view.getInt32(offset + 4, true),
        edges: view.getInt16(offset + 8, true),
        textureInfo: view.getInt16(offset + 10, true),
        lightmapOffset: view.getInt32(offset + 16, true),
      });
    }

    return faces;
  }

  private parseTextures(buffer: ArrayBuffer, lump: BSPLump): BSPTexture[] {
    // Simplified texture parsing - in real implementation you'd need to parse the full texture data
    return [];
  }

  private parseEdges(buffer: ArrayBuffer, lump: BSPLump): number[][] {
    const view = new DataView(buffer, lump.offset, lump.size);
    const edges: number[][] = [];
    const count = lump.size / 4; // 2 Uint16 per edge

    for (let i = 0; i < count; i++) {
      const offset = i * 4;
      edges.push([
        view.getUint16(offset, true),
        view.getUint16(offset + 2, true),
      ]);
    }

    return edges;
  }

  private parseSurfEdges(buffer: ArrayBuffer, lump: BSPLump): number[] {
    const view = new DataView(buffer, lump.offset, lump.size);
    const surfEdges: number[] = [];
    const count = lump.size / 4; // 4 bytes per int32

    for (let i = 0; i < count; i++) {
      surfEdges.push(view.getInt32(i * 4, true));
    }

    return surfEdges;
  }

  private parseNodes(buffer: ArrayBuffer, lump: BSPLump): BSPNode[] {
    const view = new DataView(buffer, lump.offset, lump.size);
    const nodes: BSPNode[] = [];
    const count = lump.size / 24; // 24 bytes per node

    for (let i = 0; i < count; i++) {
      const offset = i * 24;
      nodes.push({
        plane: view.getUint32(offset, true),
        front: view.getInt16(offset + 4, true),
        back: view.getInt16(offset + 6, true),
        bbox: [
          new THREE.Vector3(
            view.getInt16(offset + 8, true),
            view.getInt16(offset + 10, true),
            view.getInt16(offset + 12, true)
          ),
          new THREE.Vector3(
            view.getInt16(offset + 14, true),
            view.getInt16(offset + 16, true),
            view.getInt16(offset + 18, true)
          ),
        ],
        face: view.getUint16(offset + 20, true),
        faces: view.getUint16(offset + 22, true),
      });
    }

    return nodes;
  }

  private parseLeaves(buffer: ArrayBuffer, lump: BSPLump): BSPLeaf[] {
    const view = new DataView(buffer, lump.offset, lump.size);
    const leaves: BSPLeaf[] = [];
    const count = lump.size / 28; // 28 bytes per leaf

    for (let i = 0; i < count; i++) {
      const offset = i * 28;
      leaves.push({
        type: view.getInt32(offset, true),
        vislist: view.getInt32(offset + 4, true),
        bbox: [
          new THREE.Vector3(
            view.getInt16(offset + 8, true),
            view.getInt16(offset + 10, true),
            view.getInt16(offset + 12, true)
          ),
          new THREE.Vector3(
            view.getInt16(offset + 14, true),
            view.getInt16(offset + 16, true),
            view.getInt16(offset + 18, true)
          ),
        ],
        face: view.getUint16(offset + 20, true),
        faces: view.getUint16(offset + 22, true),
        ambient: [
          view.getUint8(offset + 24),
          view.getUint8(offset + 25),
          view.getUint8(offset + 26),
          view.getUint8(offset + 27),
        ],
      });
    }

    return leaves;
  }

  private parseModels(buffer: ArrayBuffer, lump: BSPLump): BSPModel[] {
    const view = new DataView(buffer, lump.offset, lump.size);
    const models: BSPModel[] = [];
    const count = lump.size / 64; // 64 bytes per model

    for (let i = 0; i < count; i++) {
      const offset = i * 64;
      models.push({
        min: [
          view.getFloat32(offset, true),
          view.getFloat32(offset + 4, true),
          view.getFloat32(offset + 8, true),
        ],
        max: [
          view.getFloat32(offset + 12, true),
          view.getFloat32(offset + 16, true),
          view.getFloat32(offset + 20, true),
        ],
        origin: [
          view.getFloat32(offset + 24, true),
          view.getFloat32(offset + 28, true),
          view.getFloat32(offset + 32, true),
        ],
        nodes: [
          view.getInt32(offset + 36, true),
          view.getInt32(offset + 40, true),
          view.getInt32(offset + 44, true),
          view.getInt32(offset + 48, true),
        ],
        visLeafs: view.getInt32(offset + 52, true),
        firstFace: view.getInt32(offset + 56, true),
        faces: view.getInt32(offset + 60, true),
      });
    }

    return models;
  }

  private createBSPMesh(): void {
    console.log("🏗️ Creating BSP mesh...");

    if (!this.bspData || !this.bspData.vertices) {
      console.log("⚠️ No BSP data or vertices available, using fallback");
      this.createFallbackGeometry();
      return;
    }

    console.log(`📐 Processing ${this.bspData.vertices.length} vertices...`);

    // Calculate transformation parameters before creating geometry
    this.calculateMapTransformation();

    // Create multiple meshes for better collision detection
    const mainGroup = new THREE.Group();

    // Create a simple mesh from BSP vertices for visualization
    const visualGeometry = this.createVisualGeometry();
    if (visualGeometry) {
      const visualMaterial = new THREE.MeshLambertMaterial({
        map: this.textures.wall || this.textures.default,
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8, // Make slightly transparent to help debug
      });

      const visualMesh = new THREE.Mesh(visualGeometry, visualMaterial);
      visualMesh.castShadow = true;
      visualMesh.receiveShadow = true;
      mainGroup.add(visualMesh);
      console.log("✅ Visual BSP mesh created");
    }

    // Create simplified collision geometry
    const collisionGeometry = this.createCollisionGeometry();
    if (collisionGeometry.length > 0) {
      collisionGeometry.forEach((mesh, index) => {
        // Make collision meshes invisible but functional
        mesh.visible = false;
        mesh.userData.isCollisionMesh = true;
        mainGroup.add(mesh);

        // Add to collision system
        this.addCollidableObject(mesh, "static");
        console.log(`✅ Collision mesh ${index + 1} added to collision system`);
      });
    }

    this.bspMesh = mainGroup;

    // Add the visual mesh to scene (collision meshes are already added via addCollidableObject)
    this.scene.add(mainGroup);

    // Calculate and log bounds
    const box = new THREE.Box3().setFromObject(mainGroup);
    console.log(`📦 BSP mesh bounds: 
      X: ${box.min.x.toFixed(2)} to ${box.max.x.toFixed(2)}
      Y: ${box.min.y.toFixed(2)} to ${box.max.y.toFixed(2)}  
      Z: ${box.min.z.toFixed(2)} to ${box.max.z.toFixed(2)}`);

    console.log(
      `📐 BSP mesh created with ${this.bspData.vertices.length} vertices`
    );
  }

  /**
   * Create visual geometry from BSP data following bspview pattern
   */
  private createVisualGeometry(): THREE.BufferGeometry | null {
    if (!this.bspData || !this.bspData.vertices || !this.bspData.models)
      return null;

    console.log("🏗️ Creating BSP geometry using face-based approach...");

    // First model is always the main level geometry
    const levelModel = this.bspData.models[0];
    if (!levelModel || !this.bspData.nodes) return null;

    // Traverse BSP tree to find all leaves with faces
    const levelNodes = [this.bspData.nodes[levelModel.nodes[0]]];
    const levelLeaves: number[] = [];

    while (levelNodes.length > 0) {
      const node = levelNodes.pop();
      if (!node) continue;

      const front = node.front;
      const back = node.back;

      const parseChild = (childIndex: number) => {
        if (childIndex < -1) {
          // It's a leaf (negative indices)
          levelLeaves.push(Math.abs(childIndex) - 1);
        } else if (childIndex >= 0) {
          // It's another node
          levelNodes.push(this.bspData.nodes[childIndex]);
        }
        // childIndex === -1 is a dummy leaf, ignore it
      };

      parseChild(front);
      parseChild(back);
    }

    console.log(`📊 Found ${levelLeaves.length} leaves to process`);
    console.log(
      `📊 Total BSP data - Vertices: ${this.bspData.vertices.length}, Faces: ${this.bspData.faces.length}, Edges: ${this.bspData.edges.length}`
    );

    // Process all faces from all leaves
    const allPositions: number[] = [];
    const allIndices: number[] = [];
    let vertexOffset = 0;
    let totalFacesProcessed = 0;

    levelLeaves.forEach((leafId) => {
      if (leafId >= this.bspData.leaves.length) return;

      const leaf = this.bspData.leaves[leafId];

      for (let faceOffset = 0; faceOffset < leaf.faces; faceOffset++) {
        const faceIndex = leaf.face + faceOffset;
        if (faceIndex >= this.bspData.faces.length) continue;

        const face = this.bspData.faces[faceIndex];
        const faceGeometry = this.createFaceGeometry(face);

        totalFacesProcessed++;

        if (faceGeometry && faceGeometry.positions.length > 0) {
          // Add positions
          allPositions.push(...faceGeometry.positions);

          // Add indices with offset
          faceGeometry.indices.forEach((index) => {
            allIndices.push(index + vertexOffset);
          });

          vertexOffset += faceGeometry.positions.length / 3;
        }
      }
    });

    if (allPositions.length === 0) {
      console.log("⚠️ No valid face geometry created");
      return null;
    }

    console.log(
      `📐 Processed ${totalFacesProcessed} faces, created geometry with ${
        allPositions.length / 3
      } vertices and ${allIndices.length / 3} triangles`
    );

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(allPositions, 3)
    );

    if (allIndices.length > 0) {
      geometry.setIndex(allIndices);
    }

    geometry.computeVertexNormals();
    geometry.computeBoundingBox();

    return geometry;
  }

  /**
   * Transform BSP coordinates to game coordinate system
   */
  private transformBSPCoordinate(vertex: THREE.Vector3): THREE.Vector3 {
    // Apply scaling to fit within game boundary
    const scaledVertex = vertex.clone().multiplyScalar(this.BSP_SCALE_FACTOR);

    // Apply Y offset to align with game ground level
    scaledVertex.y += this.BSP_Y_OFFSET;

    return scaledVertex;
  }

  /**
   * Calculate bounds and apply centering offset to BSP coordinates
   */
  private calculateMapTransformation(): void {
    if (
      !this.bspData ||
      !this.bspData.vertices ||
      this.bspData.vertices.length === 0
    ) {
      return;
    }

    console.log("🗺️ Calculating BSP map transformation...");

    // Calculate original bounds in BSP coordinate system
    const vertices = this.bspData.vertices;
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;
    let minZ = Infinity,
      maxZ = -Infinity;

    vertices.forEach((vertex: THREE.Vector3) => {
      // Apply coordinate transformation: Quake coords (x,y,z) -> Three.js coords (y,z,x)
      const transformed = new THREE.Vector3(vertex.y, vertex.z, vertex.x);
      minX = Math.min(minX, transformed.x);
      maxX = Math.max(maxX, transformed.x);
      minY = Math.min(minY, transformed.y);
      maxY = Math.max(maxY, transformed.y);
      minZ = Math.min(minZ, transformed.z);
      maxZ = Math.max(maxZ, transformed.z);
    });

    this.mapBounds = {
      min: new THREE.Vector3(minX, minY, minZ),
      max: new THREE.Vector3(maxX, maxY, maxZ),
    };

    // Calculate map size
    const mapSize = new THREE.Vector3(maxX - minX, maxY - minY, maxZ - minZ);

    console.log(
      `📏 Original BSP map size: ${mapSize.x.toFixed(1)} x ${mapSize.y.toFixed(
        1
      )} x ${mapSize.z.toFixed(1)}`
    );

    // Calculate scaling to fit within game boundary (with some margin)
    const targetSize = this.GAME_BOUNDARY_SIZE * 0.8; // Use 80% of boundary for safety
    const maxDimension = Math.max(mapSize.x, mapSize.z); // Don't scale based on Y
    const calculatedScale =
      maxDimension > 0 ? targetSize / maxDimension : this.BSP_SCALE_FACTOR;

    // Only update scale factor if it wasn't manually set (if it's still the default small value)
    if (this.BSP_SCALE_FACTOR <= 0.05) {
      this.BSP_SCALE_FACTOR = Math.min(calculatedScale, 0.1); // Cap at 0.1 to prevent too large maps
      console.log(
        `🔧 Auto-calculated scale factor: ${this.BSP_SCALE_FACTOR.toFixed(4)}`
      );
    } else {
      console.log(
        `🔧 Using manual scale factor: ${this.BSP_SCALE_FACTOR.toFixed(4)}`
      );
    }

    // Calculate Y offset to align map ground with game ground level
    // We want the lowest point of the map to be well below the player spawn level
    const scaledMinY = minY * this.BSP_SCALE_FACTOR;
    this.BSP_Y_OFFSET =
      this.GAME_GROUND_HEIGHT - scaledMinY + this.PLAYER_HEIGHT_BOOST; // Boost player well above map surface

    console.log(`🔧 Applied scale factor: ${this.BSP_SCALE_FACTOR.toFixed(4)}`);
    console.log(`🔧 Applied Y offset: ${this.BSP_Y_OFFSET.toFixed(2)}`);

    // Calculate final transformed bounds
    const scaledSize = mapSize.clone().multiplyScalar(this.BSP_SCALE_FACTOR);
    console.log(
      `📐 Scaled map size: ${scaledSize.x.toFixed(1)} x ${scaledSize.y.toFixed(
        1
      )} x ${scaledSize.z.toFixed(1)}`
    );
  }

  /**
   * Create geometry for a single BSP face
   */
  private createFaceGeometry(
    face: BSPFace
  ): { positions: number[]; indices: number[] } | null {
    if (
      !this.bspData ||
      !this.bspData.vertices ||
      !this.bspData.edges ||
      !this.bspData.surfEdges
    ) {
      return null;
    }

    const positions: number[] = [];
    const faceVertices: THREE.Vector3[] = [];

    // Extract vertices for this face using edges
    for (let i = 0; i < face.edges; i++) {
      const surfEdgeIndex = face.firstEdge + i;
      if (surfEdgeIndex >= this.bspData.surfEdges.length) continue;

      const surfEdge = this.bspData.surfEdges[surfEdgeIndex];
      const edgeIndex = Math.abs(surfEdge);

      if (edgeIndex >= this.bspData.edges.length) continue;

      const edge = this.bspData.edges[edgeIndex];

      // Choose vertex based on surfEdge direction
      let vertexIndex = surfEdge < 0 ? edge[1] : edge[0];

      if (vertexIndex >= this.bspData.vertices.length) continue;

      const vertex = this.bspData.vertices[vertexIndex];

      // Apply coordinate transformation: Quake coords (x,y,z) -> Three.js coords (y,z,x)
      // Then apply scaling and offset for game compatibility
      const transformedVertex = this.transformBSPCoordinate(
        new THREE.Vector3(vertex.y, vertex.z, vertex.x)
      );
      faceVertices.push(transformedVertex);

      positions.push(
        transformedVertex.x,
        transformedVertex.y,
        transformedVertex.z
      );
    }

    if (faceVertices.length < 3) {
      return null; // Need at least 3 vertices for a face
    }

    // Triangulate the face (fan triangulation)
    const indices: number[] = [];
    for (let i = 1; i < faceVertices.length - 1; i++) {
      indices.push(0, i, i + 1);
    }

    return { positions, indices };
  }

  /**
   * Create simplified collision geometry for better performance
   */
  private createCollisionGeometry(): THREE.Mesh[] {
    if (!this.bspData || !this.bspData.vertices) return [];

    const collisionMeshes: THREE.Mesh[] = [];

    // Create bounding boxes around vertex clusters for collision
    const clusterSize = 50; // Process vertices in clusters
    const vertices = this.bspData.vertices;

    for (let i = 0; i < vertices.length; i += clusterSize) {
      const cluster = vertices.slice(i, i + clusterSize);
      if (cluster.length < 3) continue;

      // Calculate bounding box for this cluster with transformed coordinates
      const clusterBox = new THREE.Box3();
      cluster.forEach((vertex: THREE.Vector3) => {
        // Apply the same transformation as in face geometry
        const transformedVertex = this.transformBSPCoordinate(
          new THREE.Vector3(vertex.y, vertex.z, vertex.x)
        );
        clusterBox.expandByPoint(transformedVertex);
      });

      // Only create collision box if it's reasonable size (adjusted for scaled coordinates)
      const size = clusterBox.getSize(new THREE.Vector3());
      const minSize = 0.1; // Smaller threshold for scaled coordinates
      const maxSize = this.GAME_BOUNDARY_SIZE / 4; // Max size relative to game boundary

      if (
        size.x > minSize &&
        size.y > minSize &&
        size.z > minSize &&
        size.x < maxSize &&
        size.y < maxSize &&
        size.z < maxSize
      ) {
        const center = clusterBox.getCenter(new THREE.Vector3());
        const boxGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const boxMaterial = new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
          wireframe: true,
        });

        const collisionBox = new THREE.Mesh(boxGeometry, boxMaterial);
        collisionBox.position.copy(center);
        collisionMeshes.push(collisionBox);
      }
    }

    console.log(
      `🎯 Created ${collisionMeshes.length} collision boxes for scaled BSP map`
    );
    return collisionMeshes;
  }

  /**
   * Check if three vertices form a valid triangle
   */
  private isValidTriangle(
    v1: THREE.Vector3,
    v2: THREE.Vector3,
    v3: THREE.Vector3
  ): boolean {
    // Check if vertices are not collinear and have reasonable distance
    const edge1 = new THREE.Vector3().subVectors(v2, v1);
    const edge2 = new THREE.Vector3().subVectors(v3, v1);
    const cross = new THREE.Vector3().crossVectors(edge1, edge2);

    // Triangle is valid if cross product magnitude is above threshold
    return cross.length() > 0.001;
  }

  private createFallbackGeometry(): void {
    console.log("🏗️ Creating fallback geometry (BSP load failed)...");

    // Ensure we have textures for fallback
    if (Object.keys(this.textures).length === 0) {
      this.createProceduralTextures();
    }

    // Create a more interesting fallback level when BSP loading fails
    const group = new THREE.Group();

    // Main floor
    const floorGeometry = new THREE.BoxGeometry(80, 2, 80);
    const floorMaterial = new THREE.MeshLambertMaterial({
      map: this.textures.floor,
      color: 0xffffff,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -1;
    floor.receiveShadow = true;
    group.add(floor);
    console.log("✅ Fallback floor created with concrete texture");

    // Add some walls to create a basic arena
    const wallMaterial = new THREE.MeshLambertMaterial({
      map: this.textures.wall,
      color: 0xffffff,
    });

    // Create perimeter walls
    const wallHeight = 10;
    const wallThickness = 2;
    const arenaSize = 40;

    // North wall
    const northWall = new THREE.Mesh(
      new THREE.BoxGeometry(arenaSize * 2, wallHeight, wallThickness),
      wallMaterial
    );
    northWall.position.set(0, wallHeight / 2, arenaSize);
    northWall.castShadow = true;
    group.add(northWall);

    // South wall
    const southWall = new THREE.Mesh(
      new THREE.BoxGeometry(arenaSize * 2, wallHeight, wallThickness),
      wallMaterial
    );
    southWall.position.set(0, wallHeight / 2, -arenaSize);
    southWall.castShadow = true;
    group.add(southWall);

    // East wall
    const eastWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, arenaSize * 2),
      wallMaterial
    );
    eastWall.position.set(arenaSize, wallHeight / 2, 0);
    eastWall.castShadow = true;
    group.add(eastWall);

    // West wall
    const westWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, arenaSize * 2),
      wallMaterial
    );
    westWall.position.set(-arenaSize, wallHeight / 2, 0);
    westWall.castShadow = true;
    group.add(westWall);

    console.log("✅ Fallback walls created with brick texture");

    // Add some interior structures
    const structureMaterial = new THREE.MeshLambertMaterial({
      map: this.textures.metal,
      color: 0xffffff,
    });

    // Central pillar
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(4, wallHeight, 4),
      structureMaterial
    );
    pillar.position.set(0, wallHeight / 2, 0);
    pillar.castShadow = true;
    group.add(pillar);

    // Corner structures
    const cornerSize = 6;
    const cornerHeight = 6;
    const cornerPositions = [
      new THREE.Vector3(20, cornerHeight / 2, 20),
      new THREE.Vector3(-20, cornerHeight / 2, 20),
      new THREE.Vector3(20, cornerHeight / 2, -20),
      new THREE.Vector3(-20, cornerHeight / 2, -20),
    ];

    cornerPositions.forEach((pos) => {
      const corner = new THREE.Mesh(
        new THREE.BoxGeometry(cornerSize, cornerHeight, cornerSize),
        structureMaterial
      );
      corner.position.copy(pos);
      corner.castShadow = true;
      group.add(corner);
    });

    console.log("✅ Fallback interior structures created with metal texture");

    this.bspMesh = group as any; // Type cast for compatibility

    // Add all collision objects (addCollidableObject automatically adds to scene)
    this.addCollidableObject(floor, "static");
    this.addCollidableObject(northWall, "static");
    this.addCollidableObject(southWall, "static");
    this.addCollidableObject(eastWall, "static");
    this.addCollidableObject(westWall, "static");
    this.addCollidableObject(pillar, "static");

    // Add corner structures to collision system
    const cornersStartIndex = group.children.length - 4;
    for (let i = 0; i < 4; i++) {
      const corner = group.children[cornersStartIndex + i] as THREE.Mesh;
      if (corner) {
        this.addCollidableObject(corner, "static");
      }
    }

    console.log(
      `✅ Fallback geometry complete - ${group.children.length} objects created`
    );
    console.log("📦 Fallback arena bounds: 80x80 units, walls 10 units high");
    console.log("🔄 Created enhanced fallback geometry for BSP map");
  }

  createAtmosphere(): void {
    // Create atmospheric effects suitable for indoor/outdoor BSP maps
    const fog = new THREE.Fog(this.config.fogColor, 50, 300);
    this.scene.fog = fog;

    // Add subtle particles for atmosphere
    const particleSystem = this.createParticleSystem(20, 0x888888, 1, 0.2);
    this.scene.add(particleSystem);
  }

  createGround(): THREE.Mesh {
    // For BSP maps, the ground is part of the map geometry
    // Return a transparent placeholder
    const groundGeometry = new THREE.PlaneGeometry(1, 1);
    const groundMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
    });

    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.visible = false;

    return ground;
  }

  createSky(): THREE.Mesh {
    // Create a skybox suitable for BSP maps
    const skyGeometry = new THREE.SphereGeometry(800, 32, 16);
    const skyMaterial = new THREE.MeshBasicMaterial({
      color: this.config.skyColor,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });

    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    sky.renderOrder = -1000;
    sky.frustumCulled = false;

    return sky;
  }

  addLighting(): void {
    // Bright lighting suitable for BSP maps
    const ambientLight = new THREE.AmbientLight(
      this.config.ambientLightColor,
      1.2
    );
    this.scene.add(ambientLight);

    // Main directional light
    const directionalLight = new THREE.DirectionalLight(
      this.config.directionalLightColor,
      1.8
    );
    directionalLight.position.set(100, 200, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    this.scene.add(directionalLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(
      this.config.fillLightColor,
      0.8
    );
    fillLight.position.set(-100, 150, -100);
    this.scene.add(fillLight);

    // Additional hemisphere light for even coverage
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    this.scene.add(hemisphereLight);

    console.log("💡 BSP map lighting initialized");
  }

  addEnvironmentObjects(): void {
    // BSP maps contain their own environment objects
    // Add minimal additional objects if needed
    if (this.bspMesh) {
      // Map is already loaded, add any additional decorative elements
      this.addSpawnPoints();
    }
  }

  /**
   * Add visual indicators for spawn points with debug information
   */
  private addSpawnPoints(): void {
    // Add visual indicators for spawn points
    const spawnGeometry = new THREE.CylinderGeometry(1, 1, 0.2, 16);
    const spawnMaterial = new THREE.MeshBasicMaterial({
      color: this.config.glowColor,
      transparent: true,
      opacity: 0.6,
    });

    // Get multiple spawn positions
    const spawnPositions = this.getSafeSpawnPositions();

    spawnPositions.forEach((pos, index) => {
      const spawn = new THREE.Mesh(spawnGeometry, spawnMaterial.clone());
      spawn.position.copy(pos);
      spawn.position.y += 0.1;
      spawn.name = `spawn_point_${index}`;
      this.scene.add(spawn);

      console.log(
        `🎯 Spawn point ${index}: (${pos.x.toFixed(2)}, ${pos.y.toFixed(
          2
        )}, ${pos.z.toFixed(2)})`
      );
    });

    // Add debug text display
    this.addDebugInfo();
  }

  /**
   * Add debug information display
   */
  private addDebugInfo(): void {
    console.log("📋 BSP Map Debug Information:");
    console.log(`Map: ${this.loadedMapName}`);
    console.log(`Vertices: ${this.bspData?.vertices?.length || 0}`);
    console.log(`Faces: ${this.bspData?.faces?.length || 0}`);
    console.log(`Textures loaded: ${Object.keys(this.textures).length}`);
    console.log(`Scale Factor: ${this.BSP_SCALE_FACTOR.toFixed(4)}`);
    console.log(`Y Offset: ${this.BSP_Y_OFFSET.toFixed(2)}`);
    console.log(`Game Boundary Size: ${this.GAME_BOUNDARY_SIZE}`);
    console.log(`Game Ground Height: ${this.GAME_GROUND_HEIGHT}`);

    if (this.bspMesh) {
      const box = new THREE.Box3().setFromObject(this.bspMesh);
      console.log(
        `Transformed map bounds: X(${box.min.x.toFixed(
          1
        )} to ${box.max.x.toFixed(1)}), Y(${box.min.y.toFixed(
          1
        )} to ${box.max.y.toFixed(1)}), Z(${box.min.z.toFixed(
          1
        )} to ${box.max.z.toFixed(1)})`
      );

      const size = box.getSize(new THREE.Vector3());
      console.log(
        `Final map size: ${size.x.toFixed(1)} x ${size.y.toFixed(
          1
        )} x ${size.z.toFixed(1)} units`
      );

      // Check if map fits within game boundary
      const halfBoundary = this.GAME_BOUNDARY_SIZE / 2;
      const fitsInBoundary =
        size.x <= this.GAME_BOUNDARY_SIZE && size.z <= this.GAME_BOUNDARY_SIZE;
      console.log(`Map fits in game boundary: ${fitsInBoundary ? "✅" : "❌"}`);

      if (!fitsInBoundary) {
        console.log(
          `⚠️ Map size (${size.x.toFixed(1)} x ${size.z.toFixed(
            1
          )}) exceeds boundary (${this.GAME_BOUNDARY_SIZE})`
        );
      }
    }
  }

  addGroundDetails(): void {
    // BSP maps have built-in ground details
    // Add minimal additional details if needed
  }

  /**
   * Get information about the loaded BSP map
   */
  public getMapInfo(): string {
    if (!this.bspData) return "No BSP map loaded";

    return `BSP Map: ${this.loadedMapName}\nVertices: ${
      this.bspData.vertices?.length || 0
    }\nFaces: ${this.bspData.faces?.length || 0}`;
  }

  /**
   * Check if a BSP map is currently loaded
   */
  public hasMapLoaded(): boolean {
    return this.bspData !== null && this.bspMesh !== null;
  }

  /**
   * Calculate safe spawn positions based on BSP map geometry
   */
  public calculateSafeSpawnPosition(): THREE.Vector3 {
    console.log("🎯 Calculating safe spawn position for BSP map...");

    if (
      !this.bspData ||
      !this.bspData.vertices ||
      this.bspData.vertices.length === 0 ||
      !this.mapBounds
    ) {
      // Fallback to game's standard spawn position
      console.log("🚁 Using fallback spawn position (no BSP data)");
      return new THREE.Vector3(0, this.GAME_GROUND_HEIGHT + 0.2, 0);
    }

    // Use the pre-calculated transformed bounds
    const bounds = this.mapBounds;
    const scaledBounds = {
      minX: bounds.min.x * this.BSP_SCALE_FACTOR,
      maxX: bounds.max.x * this.BSP_SCALE_FACTOR,
      minY: bounds.min.y * this.BSP_SCALE_FACTOR + this.BSP_Y_OFFSET,
      maxY: bounds.max.y * this.BSP_SCALE_FACTOR + this.BSP_Y_OFFSET,
      minZ: bounds.min.z * this.BSP_SCALE_FACTOR,
      maxZ: bounds.max.z * this.BSP_SCALE_FACTOR,
    };

    // Calculate map center in game coordinates
    const centerX = (scaledBounds.minX + scaledBounds.maxX) / 2;
    const centerZ = (scaledBounds.minZ + scaledBounds.maxZ) / 2;

    console.log(
      `🎯 Transformed BSP map bounds: X(${scaledBounds.minX.toFixed(
        1
      )} to ${scaledBounds.maxX.toFixed(1)}), Y(${scaledBounds.minY.toFixed(
        1
      )} to ${scaledBounds.maxY.toFixed(1)}), Z(${scaledBounds.minZ.toFixed(
        1
      )} to ${scaledBounds.maxZ.toFixed(1)})`
    );

    console.log(
      `🎯 Map center calculated as: (${centerX.toFixed(1)}, ${centerZ.toFixed(
        1
      )})`
    );

    console.log(`🎯 Game boundary is: ±${this.GAME_BOUNDARY_SIZE / 2} units`);

    // Calculate proper ground level - use transformed map geometry with boost
    // Since we boosted the map down, we need to place player at an appropriate level above it
    const mapGroundLevel = scaledBounds.minY;
    const adjustedGroundLevel = mapGroundLevel + this.PLAYER_HEIGHT_BOOST;
    const playerGroundLevel = Math.max(
      adjustedGroundLevel,
      this.GAME_GROUND_HEIGHT
    );

    console.log(
      `🎯 Map ground level: ${mapGroundLevel.toFixed(
        2
      )}, Adjusted ground level: ${adjustedGroundLevel.toFixed(
        2
      )}, Player ground level: ${playerGroundLevel.toFixed(2)}`
    );

    // Return position at player's feet level (not camera level - PlayerController will add camera height)
    const groundLevel = playerGroundLevel;

    console.log(
      `📐 Transformed map size: ${(
        scaledBounds.maxX - scaledBounds.minX
      ).toFixed(1)} x ${(scaledBounds.maxY - scaledBounds.minY).toFixed(
        1
      )} x ${(scaledBounds.maxZ - scaledBounds.minZ).toFixed(1)} units`
    );

    // Try multiple spawn strategies in order of preference
    const spawnStrategies = [
      () =>
        this.findOpenAreaSpawn(
          scaledBounds.minX,
          scaledBounds.maxX,
          scaledBounds.minY,
          scaledBounds.maxY,
          scaledBounds.minZ,
          scaledBounds.maxZ
        ),
      () =>
        this.findEdgeSpawn(
          scaledBounds.minX,
          scaledBounds.maxX,
          scaledBounds.minY,
          scaledBounds.maxY,
          scaledBounds.minZ,
          scaledBounds.maxZ
        ),
      () =>
        this.findElevatedSpawn(
          scaledBounds.minX,
          scaledBounds.maxX,
          scaledBounds.minY,
          scaledBounds.maxY,
          scaledBounds.minZ,
          scaledBounds.maxZ
        ),
      () => new THREE.Vector3(centerX, groundLevel, centerZ), // Simple center spawn
    ];

    for (const strategy of spawnStrategies) {
      const spawnPosition = strategy();
      if (spawnPosition && this.validateSpawnPosition(spawnPosition)) {
        console.log(
          `✅ Safe spawn position found: (${spawnPosition.x.toFixed(
            1
          )}, ${spawnPosition.y.toFixed(1)}, ${spawnPosition.z.toFixed(1)})`
        );
        return spawnPosition;
      }
    }

    // Ultimate fallback - game's standard spawn position
    console.log(
      "⚠️ All spawn strategies failed, using game standard spawn position"
    );
    return new THREE.Vector3(0, this.GAME_GROUND_HEIGHT + 0.2, 0);
  }

  /**
   * Find spawn position in open area (preferred)
   */
  private findOpenAreaSpawn(
    minX: number,
    maxX: number,
    minY: number,
    maxY: number,
    minZ: number,
    maxZ: number
  ): THREE.Vector3 | null {
    console.log("🔍 Trying open area spawn strategy...");

    // Try positions in the open area of the map
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const mapWidth = maxX - minX;
    const mapDepth = maxZ - minZ;

    // Use conservative ground level calculation - align with map surface and boost
    const groundLevel = Math.max(
      minY + this.PLAYER_HEIGHT_BOOST,
      this.GAME_GROUND_HEIGHT
    ); // Well above the map surface

    // Try center and nearby positions - ensure they're well inside the map bounds
    const safeMargin = Math.min(mapWidth * 0.2, mapDepth * 0.2, 10); // Safer margin
    const candidates = [
      new THREE.Vector3(centerX, groundLevel, centerZ), // Center
      new THREE.Vector3(centerX + safeMargin, groundLevel, centerZ), // Safely off-center
      new THREE.Vector3(centerX - safeMargin, groundLevel, centerZ),
      new THREE.Vector3(centerX, groundLevel, centerZ + safeMargin),
      new THREE.Vector3(centerX, groundLevel, centerZ - safeMargin),
      // Try closer to center if map is small
      new THREE.Vector3(
        centerX + safeMargin * 0.5,
        groundLevel,
        centerZ + safeMargin * 0.5
      ),
      new THREE.Vector3(
        centerX - safeMargin * 0.5,
        groundLevel,
        centerZ + safeMargin * 0.5
      ),
      new THREE.Vector3(
        centerX + safeMargin * 0.5,
        groundLevel,
        centerZ - safeMargin * 0.5
      ),
      new THREE.Vector3(
        centerX - safeMargin * 0.5,
        groundLevel,
        centerZ - safeMargin * 0.5
      ),
    ];

    for (const candidate of candidates) {
      if (this.isPositionInOpenArea(candidate, minX, maxX, minZ, maxZ)) {
        console.log("✅ Found open area spawn position");
        return candidate;
      }
    }

    console.log("❌ No suitable open area spawn found");
    return null;
  }

  /**
   * Find spawn position near map edges (secondary option)
   */
  private findEdgeSpawn(
    minX: number,
    maxX: number,
    minY: number,
    maxY: number,
    minZ: number,
    maxZ: number
  ): THREE.Vector3 | null {
    console.log("🔍 Trying edge spawn strategy...");

    const groundLevel = Math.max(
      minY + this.PLAYER_HEIGHT_BOOST,
      this.GAME_GROUND_HEIGHT
    );
    const margin = Math.min((maxX - minX) * 0.3, (maxZ - minZ) * 0.3, 5); // Safer margin based on map size

    // Try positions well inside the map, not near edges
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const edgeCandidates = [
      new THREE.Vector3(centerX - margin, groundLevel, centerZ),
      new THREE.Vector3(centerX + margin, groundLevel, centerZ),
      new THREE.Vector3(centerX, groundLevel, centerZ - margin),
      new THREE.Vector3(centerX, groundLevel, centerZ + margin),
      // Additional inside positions
      new THREE.Vector3(
        centerX - margin * 0.6,
        groundLevel,
        centerZ - margin * 0.6
      ),
      new THREE.Vector3(
        centerX + margin * 0.6,
        groundLevel,
        centerZ - margin * 0.6
      ),
      new THREE.Vector3(
        centerX - margin * 0.6,
        groundLevel,
        centerZ + margin * 0.6
      ),
      new THREE.Vector3(
        centerX + margin * 0.6,
        groundLevel,
        centerZ + margin * 0.6
      ),
    ];

    for (const candidate of edgeCandidates) {
      if (this.isPositionInOpenArea(candidate, minX, maxX, minZ, maxZ)) {
        console.log("✅ Found edge spawn position");
        return candidate;
      }
    }

    console.log("❌ No suitable edge spawn found");
    return null;
  }

  /**
   * Find elevated spawn position (when ground level fails)
   */
  private findElevatedSpawn(
    minX: number,
    maxX: number,
    minY: number,
    maxY: number,
    minZ: number,
    maxZ: number
  ): THREE.Vector3 | null {
    console.log("🔍 Trying elevated spawn strategy...");

    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;

    // Try different elevations - adjusted for game scale with boost
    const baseGroundLevel = Math.max(
      minY + this.PLAYER_HEIGHT_BOOST,
      this.GAME_GROUND_HEIGHT
    );
    const elevationLevels = [
      baseGroundLevel + 2, // Slightly above ground
      baseGroundLevel + 5, // Moderately elevated
      baseGroundLevel + 8, // High above ground
      Math.min(maxY - 1, baseGroundLevel + 10), // Near ceiling but not touching
    ];

    for (const elevation of elevationLevels) {
      const candidate = new THREE.Vector3(centerX, elevation, centerZ);
      if (this.isElevatedPositionSafe(candidate, minX, maxX, minZ, maxZ)) {
        console.log(
          `✅ Found elevated spawn at height ${elevation.toFixed(1)}`
        );
        return candidate;
      }
    }

    console.log("❌ No suitable elevated spawn found");
    return null;
  }

  /**
   * Fallback spawn when all else fails
   */
  private getFallbackSpawn(
    minX: number,
    maxX: number,
    minY: number,
    maxY: number,
    minZ: number,
    maxZ: number
  ): THREE.Vector3 {
    console.log("🔍 Using fallback spawn strategy...");

    // Use a safe position well above the map
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const safeHeight = Math.max(maxY + 10, 20); // Well above everything

    return new THREE.Vector3(centerX, safeHeight, centerZ);
  }

  /**
   * Check if a position is in an open area (not inside geometry)
   */
  private isPositionInOpenArea(
    position: THREE.Vector3,
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number
  ): boolean {
    // Basic bounds check - ensure position is well inside the map
    const mapWidth = maxX - minX;
    const mapDepth = maxZ - minZ;
    const margin = Math.min(mapWidth * 0.1, mapDepth * 0.1, 2); // Dynamic margin

    const isInBounds =
      position.x >= minX + margin &&
      position.x <= maxX - margin &&
      position.z >= minZ + margin &&
      position.z <= maxZ - margin;

    if (!isInBounds) {
      console.log(
        `❌ Position (${position.x.toFixed(1)}, ${position.z.toFixed(
          1
        )}) is outside map bounds`
      );
      return false;
    }

    // Check if position conflicts with transformed vertices (simple proximity check)
    if (this.bspData && this.bspData.vertices) {
      const minDistance = 1.5; // Reduced minimum distance for scaled coordinates
      for (const vertex of this.bspData.vertices) {
        // Apply same transformation as used elsewhere
        const transformedVertex = this.transformBSPCoordinate(
          new THREE.Vector3(vertex.y, vertex.z, vertex.x)
        );
        const distance = position.distanceTo(transformedVertex);
        if (distance < minDistance) {
          return false; // Too close to geometry
        }
      }
    }

    return true;
  }

  /**
   * Check if an elevated position is safe
   */
  private isElevatedPositionSafe(
    position: THREE.Vector3,
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number
  ): boolean {
    // Ensure position is within scaled map bounds (with smaller margin)
    const margin = 2; // Reduced margin for scaled coordinates
    return (
      position.x >= minX + margin &&
      position.x <= maxX - margin &&
      position.z >= minZ + margin &&
      position.z <= maxZ - margin
    );
  }

  /**
   * Validate that a spawn position is truly safe
   */
  private validateSpawnPosition(position: THREE.Vector3): boolean {
    // Check if the collision system is available
    const collisionSystem = this.scene.userData?.collisionSystem;
    if (collisionSystem && collisionSystem.checkCollision) {
      const collision = collisionSystem.checkCollision(position);
      if (collision) {
        console.log("❌ Spawn position failed collision check");
        return false;
      }
    }

    // Basic sanity checks adjusted for game coordinate system
    if (position.y < 0 || position.y > 50) {
      console.log("❌ Spawn position has invalid Y coordinate for game scale");
      return false;
    }

    // Check if position is within game boundary
    const halfBoundary = this.GAME_BOUNDARY_SIZE / 2;
    if (
      Math.abs(position.x) > halfBoundary ||
      Math.abs(position.z) > halfBoundary
    ) {
      console.log("❌ Spawn position is outside game boundary");
      return false;
    }

    console.log("✅ Spawn position passed validation");
    return true;
  }

  /**
   * Get multiple safe spawn positions around the map
   */
  public getSafeSpawnPositions(): THREE.Vector3[] {
    const centerSpawn = this.calculateSafeSpawnPosition();

    // Create multiple spawn points around the center (adjusted for game scale)
    const spawnOffset = 5; // Smaller offset for scaled coordinates
    const spawnPositions = [
      centerSpawn.clone(),
      centerSpawn.clone().add(new THREE.Vector3(spawnOffset, 0, 0)),
      centerSpawn.clone().add(new THREE.Vector3(-spawnOffset, 0, 0)),
      centerSpawn.clone().add(new THREE.Vector3(0, 0, spawnOffset)),
      centerSpawn.clone().add(new THREE.Vector3(0, 0, -spawnOffset)),
      centerSpawn.clone().add(new THREE.Vector3(spawnOffset, 0, spawnOffset)),
      centerSpawn.clone().add(new THREE.Vector3(-spawnOffset, 0, spawnOffset)),
      centerSpawn.clone().add(new THREE.Vector3(spawnOffset, 0, -spawnOffset)),
      centerSpawn.clone().add(new THREE.Vector3(-spawnOffset, 0, -spawnOffset)),
    ];

    // Filter out positions that are outside game boundary
    const validPositions = spawnPositions.filter((pos) =>
      this.validateSpawnPosition(pos)
    );

    // If we don't have enough valid positions, add some safe fallbacks
    if (validPositions.length < 4) {
      const safePositions = [
        new THREE.Vector3(0, this.GAME_GROUND_HEIGHT + 0.2, 0),
        new THREE.Vector3(10, this.GAME_GROUND_HEIGHT + 0.2, 10),
        new THREE.Vector3(-10, this.GAME_GROUND_HEIGHT + 0.2, 10),
        new THREE.Vector3(10, this.GAME_GROUND_HEIGHT + 0.2, -10),
        new THREE.Vector3(-10, this.GAME_GROUND_HEIGHT + 0.2, -10),
      ];
      validPositions.push(...safePositions);
    }

    console.log(
      `🎯 Generated ${validPositions.length} valid spawn positions for BSP map`
    );
    return validPositions.slice(0, 9); // Return up to 9 positions
  }

  // Create particle system helper (would be moved to base class)
  protected createParticleSystem(
    count: number,
    color: number,
    size: number,
    opacity: number
  ): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 200;
      positions[i + 1] = Math.random() * 50;
      positions[i + 2] = (Math.random() - 0.5) * 200;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color,
      size,
      transparent: true,
      opacity,
    });

    return new THREE.Points(geometry, material);
  }
}

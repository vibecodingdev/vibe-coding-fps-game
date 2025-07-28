import * as THREE from "three";
import { BaseSceneTheme, SceneThemeConfig } from "../core/SceneTheme";

interface RoomData {
  id: string;
  position: THREE.Vector3;
  size: THREE.Vector3;
  type: "normal" | "boss" | "secret" | "start" | "exit";
  connections: string[];
  elevation: number;
  lighting: {
    color: number;
    intensity: number;
  };
}

interface HallwayData {
  id: string;
  start: THREE.Vector3;
  end: THREE.Vector3;
  width: number;
  height: number;
  doors: boolean;
}

export class DoomMapTheme extends BaseSceneTheme {
  private rooms: Map<string, RoomData> = new Map();
  private hallways: HallwayData[] = [];
  private mapScale = 2.5; // Scale factor for converting 2D map to 3D
  private wallHeight = 8;
  private doorHeight = 6;
  private doorWidth = 3;

  constructor(scene: THREE.Scene) {
    const config: SceneThemeConfig = {
      name: "Doom Map",
      primaryColor: 0x4a4a4a, // Brighter gray concrete
      secondaryColor: 0x6a6a6a, // Lighter gray for walls
      fogColor: 0x2a2a2a, // Lighter fog
      ambientLightColor: 0x606060, // Brighter ambient
      directionalLightColor: 0xa0a0a0, // Brighter directional
      fillLightColor: 0x808080, // Brighter fill
      groundColor: 0x4a4a4a, // Brighter concrete floor
      skyColor: 0x1a1a1a, // Lighter sky
      glowColor: 0x00ff00, // Green for computer terminals
      accentColor: 0xff4400, // Orange/red for danger areas
    };
    super(scene, config);
    this.initializeMapLayout();
  }

  private initializeMapLayout(): void {
    // Redesigned based on the exact Doom E1M1 schematic with proper angles and connections
    // Scale: Each unit represents ~3 meters for proper navigation
    
    // Starting room (bottom-right in schematic)
    this.rooms.set("start", {
      id: "start",
      position: new THREE.Vector3(40, 0, -40),
      size: new THREE.Vector3(16, this.wallHeight, 12),
      type: "start",
      connections: ["main_hall"],
      elevation: 0,
      lighting: { color: 0x4040ff, intensity: 1.2 }
    });

    // Main hallway connecting start to central area
    this.rooms.set("main_hall", {
      id: "main_hall",
      position: new THREE.Vector3(20, 0, -40),
      size: new THREE.Vector3(20, this.wallHeight, 8),
      type: "normal",
      connections: ["start", "central_hub", "east_branch"],
      elevation: 0,
      lighting: { color: 0x808080, intensity: 1.0 }
    });

    // Central hub area (middle of schematic)
    this.rooms.set("central_hub", {
      id: "central_hub",
      position: new THREE.Vector3(0, 0, -20),
      size: new THREE.Vector3(24, this.wallHeight, 20),
      type: "normal",
      connections: ["main_hall", "north_wing", "west_corridor", "south_branch"],
      elevation: 0,
      lighting: { color: 0x606060, intensity: 1.1 }
    });

    // North wing (upper part of schematic)
    this.rooms.set("north_wing", {
      id: "north_wing",
      position: new THREE.Vector3(0, 0, 20),
      size: new THREE.Vector3(32, this.wallHeight, 16),
      type: "normal",
      connections: ["central_hub", "northeast_rooms", "northwest_area"],
      elevation: 0,
      lighting: { color: 0xff6040, intensity: 1.0 }
    });

    // Northeast rooms complex
    this.rooms.set("northeast_rooms", {
      id: "northeast_rooms",
      position: new THREE.Vector3(25, 0, 35),
      size: new THREE.Vector3(18, this.wallHeight, 14),
      type: "normal",
      connections: ["north_wing", "curved_passage"],
      elevation: 0,
      lighting: { color: 0x40ff40, intensity: 1.1 }
    });

    // Curved passage (the distinctive zigzag in upper right)
    this.rooms.set("curved_passage", {
      id: "curved_passage",
      position: new THREE.Vector3(45, 0, 20),
      size: new THREE.Vector3(12, this.wallHeight, 30),
      type: "normal",
      connections: ["northeast_rooms"],
      elevation: 0,
      lighting: { color: 0x8040ff, intensity: 0.9 }
    });

    // Northwest area
    this.rooms.set("northwest_area", {
      id: "northwest_area",
      position: new THREE.Vector3(-25, 0, 35),
      size: new THREE.Vector3(20, this.wallHeight, 14),
      type: "normal",
      connections: ["north_wing", "west_complex"],
      elevation: 0,
      lighting: { color: 0x40ffff, intensity: 1.0 }
    });

    // West corridor (left side connection)
    this.rooms.set("west_corridor", {
      id: "west_corridor",
      position: new THREE.Vector3(-30, 0, -10),
      size: new THREE.Vector3(16, this.wallHeight, 24),
      type: "normal",
      connections: ["central_hub", "west_complex", "boss_chamber"],
      elevation: 0,
      lighting: { color: 0xffff40, intensity: 1.0 }
    });

    // West complex (far left area)
    this.rooms.set("west_complex", {
      id: "west_complex",
      position: new THREE.Vector3(-50, 0, 15),
      size: new THREE.Vector3(16, this.wallHeight, 30),
      type: "normal",
      connections: ["west_corridor", "northwest_area", "exit_area"],
      elevation: 0,
      lighting: { color: 0xff8040, intensity: 0.9 }
    });

    // Boss chamber (distinctive large room)
    this.rooms.set("boss_chamber", {
      id: "boss_chamber",
      position: new THREE.Vector3(-45, 2, -30),
      size: new THREE.Vector3(20, this.wallHeight + 4, 18),
      type: "boss",
      connections: ["west_corridor"],
      elevation: 2,
      lighting: { color: 0xff0040, intensity: 1.8 }
    });

    // Exit area
    this.rooms.set("exit_area", {
      id: "exit_area",
      position: new THREE.Vector3(-65, 1, 40),
      size: new THREE.Vector3(12, this.wallHeight, 12),
      type: "exit",
      connections: ["west_complex"],
      elevation: 1,
      lighting: { color: 0x4080ff, intensity: 1.4 }
    });

    // East branch (right side extension)
    this.rooms.set("east_branch", {
      id: "east_branch",
      position: new THREE.Vector3(30, 0, -60),
      size: new THREE.Vector3(14, this.wallHeight, 10),
      type: "normal",
      connections: ["main_hall"],
      elevation: 0,
      lighting: { color: 0xff4080, intensity: 1.0 }
    });

    // South branch (bottom extension)
    this.rooms.set("south_branch", {
      id: "south_branch",
      position: new THREE.Vector3(-10, 0, -50),
      size: new THREE.Vector3(12, this.wallHeight, 16),
      type: "normal",
      connections: ["central_hub"],
      elevation: 0,
      lighting: { color: 0x80ff40, intensity: 1.0 }
    });

    // Secret areas (hidden connections)
    this.rooms.set("secret_1", {
      id: "secret_1",
      position: new THREE.Vector3(15, -1, 0),
      size: new THREE.Vector3(10, this.wallHeight - 2, 8),
      type: "secret",
      connections: ["central_hub"],
      elevation: -1,
      lighting: { color: 0x00ff80, intensity: 1.5 }
    });

    // Initialize hallways with proper connections
    this.initializeHallways();
  }

  private initializeHallways(): void {
    // Redesigned hallways with proper connections and wider passages
    this.hallways = [
      // Start to main hall (wide entrance)
      {
        id: "start_to_main",
        start: new THREE.Vector3(32, 0, -40),
        end: new THREE.Vector3(28, 0, -40),
        width: 6,
        height: this.wallHeight,
        doors: false
      },
      // Main hall to central hub
      {
        id: "main_to_central",
        start: new THREE.Vector3(12, 0, -35),
        end: new THREE.Vector3(12, 0, -30),
        width: 6,
        height: this.wallHeight,
        doors: false
      },
      // Central hub to north wing
      {
        id: "central_to_north",
        start: new THREE.Vector3(0, 0, -10),
        end: new THREE.Vector3(0, 0, 12),
        width: 8,
        height: this.wallHeight,
        doors: false
      },
      // North wing to northeast rooms
      {
        id: "north_to_northeast",
        start: new THREE.Vector3(16, 0, 28),
        end: new THREE.Vector3(16, 0, 35),
        width: 6,
        height: this.wallHeight,
        doors: false
      },
      // Northeast to curved passage
      {
        id: "northeast_to_curved",
        start: new THREE.Vector3(34, 0, 35),
        end: new THREE.Vector3(39, 0, 35),
        width: 5,
        height: this.wallHeight,
        doors: false
      },
      // North wing to northwest area
      {
        id: "north_to_northwest",
        start: new THREE.Vector3(-16, 0, 28),
        end: new THREE.Vector3(-16, 0, 35),
        width: 6,
        height: this.wallHeight,
        doors: false
      },
      // Central hub to west corridor
      {
        id: "central_to_west",
        start: new THREE.Vector3(-12, 0, -15),
        end: new THREE.Vector3(-22, 0, -15),
        width: 6,
        height: this.wallHeight,
        doors: false
      },
      // West corridor to west complex
      {
        id: "west_to_complex",
        start: new THREE.Vector3(-38, 0, 2),
        end: new THREE.Vector3(-42, 0, 8),
        width: 5,
        height: this.wallHeight,
        doors: false
      },
      // West corridor to boss chamber
      {
        id: "west_to_boss",
        start: new THREE.Vector3(-35, 0, -22),
        end: new THREE.Vector3(-40, 1, -25),
        width: 5,
        height: this.wallHeight,
        doors: true
      },
      // Northwest to west complex
      {
        id: "northwest_to_complex",
        start: new THREE.Vector3(-35, 0, 30),
        end: new THREE.Vector3(-42, 0, 25),
        width: 5,
        height: this.wallHeight,
        doors: false
      },
      // West complex to exit
      {
        id: "complex_to_exit",
        start: new THREE.Vector3(-58, 0, 30),
        end: new THREE.Vector3(-59, 1, 34),
        width: 4,
        height: this.wallHeight,
        doors: true
      },
      // Main hall to east branch
      {
        id: "main_to_east",
        start: new THREE.Vector3(25, 0, -48),
        end: new THREE.Vector3(25, 0, -55),
        width: 5,
        height: this.wallHeight,
        doors: false
      },
      // Central hub to south branch
      {
        id: "central_to_south",
        start: new THREE.Vector3(-5, 0, -30),
        end: new THREE.Vector3(-8, 0, -42),
        width: 5,
        height: this.wallHeight,
        doors: false
      },
      // Secret connection to central hub (hidden)
      {
        id: "secret_connection",
        start: new THREE.Vector3(12, -1, -8),
        end: new THREE.Vector3(12, -1, -12),
        width: 3,
        height: this.wallHeight - 2,
        doors: false
      }
    ];
  }

  createAtmosphere(): void {
    // Lighter fog for better visibility
    const fog = new THREE.Fog(this.config.fogColor, 80, 400);
    this.scene.fog = fog;

    // Add subtle atmospheric particles
    const particleSystem = this.createParticleSystem(50, 0x888888, 1, 0.2);
    this.scene.add(particleSystem);
  }

  createGround(): THREE.Mesh {
    // Create sectored floor system like classic Doom
    const groundGroup = new THREE.Group();

    // Create individual floor sectors for each room
    this.rooms.forEach((room) => {
      const floorGeometry = new THREE.PlaneGeometry(room.size.x, room.size.z);
      const floorMaterial = new THREE.MeshLambertMaterial({
        color: this.adjustColorForElevation(this.config.groundColor, room.elevation),
        transparent: room.type === "secret",
        opacity: room.type === "secret" ? 0.9 : 1.0,
      });

      const floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(room.position.x, room.elevation, room.position.z);
      floor.receiveShadow = true;
      groundGroup.add(floor);
    });

    // Create hallway floors
    this.hallways.forEach((hallway) => {
      const length = hallway.start.distanceTo(hallway.end);
      const floorGeometry = new THREE.PlaneGeometry(hallway.width, length);
      const floorMaterial = new THREE.MeshLambertMaterial({
        color: this.config.groundColor,
      });

      const floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.rotation.x = -Math.PI / 2;
      
      // Position and orient the hallway floor
      const midPoint = new THREE.Vector3().addVectors(hallway.start, hallway.end).multiplyScalar(0.5);
      floor.position.copy(midPoint);
      
      const direction = new THREE.Vector3().subVectors(hallway.end, hallway.start);
      floor.rotation.y = Math.atan2(direction.x, direction.z);
      
      floor.receiveShadow = true;
      groundGroup.add(floor);
    });

    this.scene.add(groundGroup);
    return groundGroup as any; // Return group as mesh for compatibility
  }

  createSky(): THREE.Mesh {
    // Dark, oppressive sky like classic Doom
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
    // Brighter ambient lighting for better visibility
    const ambientLight = new THREE.AmbientLight(this.config.ambientLightColor, 1.2);
    this.scene.add(ambientLight);

    // Stronger main directional light
    const directionalLight = new THREE.DirectionalLight(this.config.directionalLightColor, 1.5);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    this.scene.add(directionalLight);

    // Add additional general lighting for better visibility
    const fillLight = new THREE.DirectionalLight(0x606060, 0.8);
    fillLight.position.set(-50, 80, -50);
    this.scene.add(fillLight);

    // Add sector-based lighting for each room with corrected positioning
    this.rooms.forEach((room) => {
      const sectorLight = new THREE.PointLight(
        room.lighting.color,
        room.lighting.intensity * 2, // Double the intensity
        room.size.x * 2 // Increase range
      );
      sectorLight.position.set(
        room.position.x,
        room.elevation + this.wallHeight * 0.6, // Fix positioning
        room.position.z
      );
      this.scene.add(sectorLight);

      // Add additional room lighting for better coverage
      const roomFillLight = new THREE.PointLight(0x888888, 1.0, room.size.x);
      roomFillLight.position.set(
        room.position.x,
        room.elevation + 3,
        room.position.z
      );
      this.scene.add(roomFillLight);
    });

    // Add flickering lights in hallways with better positioning
    this.hallways.forEach((hallway, index) => {
      const midPoint = new THREE.Vector3().addVectors(hallway.start, hallway.end).multiplyScalar(0.5);
      const flickerLight = this.createFlickeringLight(
        new THREE.Vector3(midPoint.x, 4, midPoint.z), // Lower height
        0xffaa44,
        2.0, // Brighter hallway lights
        hallway.width * 3 // More range
      );
      this.scene.add(flickerLight);
    });

    // Add emergency lighting grid for guaranteed visibility
    for (let x = -60; x <= 60; x += 30) {
      for (let z = -60; z <= 60; z += 30) {
        const emergencyLight = new THREE.PointLight(0x888888, 0.8, 25);
        emergencyLight.position.set(x, 8, z);
        this.scene.add(emergencyLight);
      }
    }

    console.log("🏛️ Doom Map lighting system initialized with enhanced visibility");
  }

  addEnvironmentObjects(): void {
    this.createRoomWalls();
    this.createHallwayWalls();
    this.createDoors();
    this.createRoomDetails();
    this.createDoomDecorations();
    this.setupMinimap();
  }

  private createRoomWalls(): void {
    this.rooms.forEach((room) => {
      const wallGroup = new THREE.Group();
      
      // Create four walls for each room
      const wallThickness = 0.5;
      const wallMaterial = new THREE.MeshLambertMaterial({
        color: this.getRoomWallColor(room.type),
      });

      // North wall
      const northWall = this.createWall(
        room.size.x, room.size.y, wallThickness,
        new THREE.Vector3(room.position.x, room.position.y + room.size.y/2, room.position.z + room.size.z/2),
        wallMaterial
      );
      wallGroup.add(northWall);

      // South wall
      const southWall = this.createWall(
        room.size.x, room.size.y, wallThickness,
        new THREE.Vector3(room.position.x, room.position.y + room.size.y/2, room.position.z - room.size.z/2),
        wallMaterial
      );
      wallGroup.add(southWall);

      // East wall
      const eastWall = this.createWall(
        wallThickness, room.size.y, room.size.z,
        new THREE.Vector3(room.position.x + room.size.x/2, room.position.y + room.size.y/2, room.position.z),
        wallMaterial
      );
      wallGroup.add(eastWall);

      // West wall
      const westWall = this.createWall(
        wallThickness, room.size.y, room.size.z,
        new THREE.Vector3(room.position.x - room.size.x/2, room.position.y + room.size.y/2, room.position.z),
        wallMaterial
      );
      wallGroup.add(westWall);

      // Add walls as collidable objects
      this.addCollidableObject(wallGroup, "static");
    });
  }

  private createHallwayWalls(): void {
    this.hallways.forEach((hallway) => {
      const length = hallway.start.distanceTo(hallway.end);
      const direction = new THREE.Vector3().subVectors(hallway.end, hallway.start).normalize();
      const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
      
      const wallMaterial = new THREE.MeshLambertMaterial({
        color: this.config.secondaryColor,
      });

      // Create two parallel walls for the hallway
      const wallThickness = 0.3;
      
      // Left wall
      const leftWallGeometry = new THREE.BoxGeometry(wallThickness, hallway.height, length);
      const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
      const leftPosition = new THREE.Vector3()
        .addVectors(hallway.start, hallway.end)
        .multiplyScalar(0.5)
        .add(perpendicular.clone().multiplyScalar(hallway.width / 2));
      leftWall.position.copy(leftPosition);
      leftWall.position.y = hallway.height / 2;
      leftWall.rotation.y = Math.atan2(direction.x, direction.z);
      leftWall.castShadow = true;
      leftWall.receiveShadow = true;
      this.addCollidableObject(leftWall, "static");

      // Right wall
      const rightWallGeometry = new THREE.BoxGeometry(wallThickness, hallway.height, length);
      const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
      const rightPosition = new THREE.Vector3()
        .addVectors(hallway.start, hallway.end)
        .multiplyScalar(0.5)
        .add(perpendicular.clone().multiplyScalar(-hallway.width / 2));
      rightWall.position.copy(rightPosition);
      rightWall.position.y = hallway.height / 2;
      rightWall.rotation.y = Math.atan2(direction.x, direction.z);
      rightWall.castShadow = true;
      rightWall.receiveShadow = true;
      this.addCollidableObject(rightWall, "static");
    });
  }

  private createDoors(): void {
    // Create doors for hallways that have them
    this.hallways.filter(h => h.doors).forEach((hallway) => {
      const midPoint = new THREE.Vector3().addVectors(hallway.start, hallway.end).multiplyScalar(0.5);
      const direction = new THREE.Vector3().subVectors(hallway.end, hallway.start).normalize();
      
      const doorFrameGeometry = new THREE.BoxGeometry(this.doorWidth, this.doorHeight, 0.2);
      const doorFrameMaterial = new THREE.MeshLambertMaterial({
        color: 0x4a4a4a,
      });
      
      const doorFrame = new THREE.Mesh(doorFrameGeometry, doorFrameMaterial);
      doorFrame.position.copy(midPoint);
      doorFrame.position.y = this.doorHeight / 2;
      doorFrame.rotation.y = Math.atan2(direction.x, direction.z);
      doorFrame.castShadow = true;
      doorFrame.receiveShadow = true;
      
      // Add door frame as interactive object
      this.addCollidableObject(doorFrame, "interactive");
    });
  }

  private createRoomDetails(): void {
    this.rooms.forEach((room) => {
      // Add room-specific details based on type
      switch (room.type) {
        case "boss":
          this.createBossRoomDetails(room);
          break;
        case "secret":
          this.createSecretRoomDetails(room);
          break;
        case "start":
          this.createStartRoomDetails(room);
          break;
        case "exit":
          this.createExitRoomDetails(room);
          break;
        default:
          this.createNormalRoomDetails(room);
      }
    });
  }

  private createBossRoomDetails(room: RoomData): void {
    // Elevated platform in center
    const platformGeometry = new THREE.CylinderGeometry(3, 4, 1, 8);
    const platformMaterial = new THREE.MeshLambertMaterial({
      color: 0x660000,
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(room.position.x, room.elevation + 0.5, room.position.z);
    platform.castShadow = true;
    platform.receiveShadow = true;
    this.addCollidableObject(platform, "static");

    // Add dramatic lighting
    const bossLight = new THREE.PointLight(0xff0000, 2.0, 20);
    bossLight.position.set(room.position.x, room.position.y + room.size.y, room.position.z);
    this.scene.add(bossLight);

    // Add pillars around the room
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const pillarRadius = Math.min(room.size.x, room.size.z) * 0.3;
      const pillarX = room.position.x + Math.cos(angle) * pillarRadius;
      const pillarZ = room.position.z + Math.sin(angle) * pillarRadius;
      
      const pillarGeometry = new THREE.CylinderGeometry(0.8, 1.0, room.size.y, 8);
      const pillarMaterial = new THREE.MeshLambertMaterial({
        color: 0x330000,
      });
      const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(pillarX, room.elevation + room.size.y / 2, pillarZ);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.addCollidableObject(pillar, "static");
    }
  }

  private createSecretRoomDetails(room: RoomData): void {
    // Add treasure/powerup indicators
    const treasureGeometry = new THREE.BoxGeometry(1, 1, 1);
    const treasureMaterial = new THREE.MeshBasicMaterial({
      color: this.config.glowColor,
      transparent: true,
      opacity: 0.8,
    });
    const treasure = new THREE.Mesh(treasureGeometry, treasureMaterial);
    treasure.position.set(room.position.x, room.elevation + 1, room.position.z);
    this.scene.add(treasure);

    // Add glowing light
    const secretLight = new THREE.PointLight(this.config.glowColor, 1.5, 15);
    secretLight.position.set(room.position.x, room.elevation + 3, room.position.z);
    this.scene.add(secretLight);
  }

  private createStartRoomDetails(room: RoomData): void {
    // Add spawn point indicator
    const spawnGeometry = new THREE.CylinderGeometry(1, 1, 0.2, 16);
    const spawnMaterial = new THREE.MeshBasicMaterial({
      color: 0x0088ff,
      transparent: true,
      opacity: 0.6,
    });
    const spawn = new THREE.Mesh(spawnGeometry, spawnMaterial);
    spawn.position.set(room.position.x, room.elevation + 0.1, room.position.z);
    this.scene.add(spawn);
  }

  private createExitRoomDetails(room: RoomData): void {
    // Add exit portal
    const portalGeometry = new THREE.RingGeometry(2, 3, 16);
    const portalMaterial = new THREE.MeshBasicMaterial({
      color: 0x4080ff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const portal = new THREE.Mesh(portalGeometry, portalMaterial);
    portal.position.set(room.position.x, room.elevation + 3, room.position.z);
    portal.rotation.x = Math.PI / 2;
    this.scene.add(portal);

    const exitLight = new THREE.PointLight(0x4080ff, 2.0, 25);
    exitLight.position.set(room.position.x, room.elevation + 5, room.position.z);
    this.scene.add(exitLight);
  }

  private createNormalRoomDetails(room: RoomData): void {
    // Add basic furniture/decorations
    const numObjects = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numObjects; i++) {
      const objectGeometry = new THREE.BoxGeometry(
        1 + Math.random(),
        0.5 + Math.random() * 1.5,
        1 + Math.random()
      );
      const objectMaterial = new THREE.MeshLambertMaterial({
        color: [0x4a4a4a, 0x666666, 0x333333][Math.floor(Math.random() * 3)],
      });
      const object = new THREE.Mesh(objectGeometry, objectMaterial);
      
      // Position randomly within room bounds
      object.position.set(
        room.position.x + (Math.random() - 0.5) * room.size.x * 0.6,
        room.elevation + object.geometry.parameters.height / 2,
        room.position.z + (Math.random() - 0.5) * room.size.z * 0.6
      );
      object.castShadow = true;
      object.receiveShadow = true;
      this.addCollidableObject(object, "static");
    }
  }

  private createDoomDecorations(): void {
    // Add classic Doom-style decorations throughout the map
    this.addComputerTerminals();
    this.addBarrels();
    this.addTechPanels();
  }

  private addComputerTerminals(): void {
    // Add computer terminals in various rooms
    const terminalRooms = ["courtyard", "north_rooms", "west_complex"];
    
    terminalRooms.forEach(roomId => {
      const room = this.rooms.get(roomId);
      if (!room) return;

      const terminalGeometry = new THREE.BoxGeometry(0.8, 1.5, 0.3);
      const terminalMaterial = new THREE.MeshLambertMaterial({
        color: 0x2a2a2a,
      });
      const terminal = new THREE.Mesh(terminalGeometry, terminalMaterial);
      
      // Position against a wall
      terminal.position.set(
        room.position.x + room.size.x * 0.4,
        room.elevation + 0.75,
        room.position.z + room.size.z * 0.4
      );
      terminal.castShadow = true;
      terminal.receiveShadow = true;
      this.addCollidableObject(terminal, "interactive");

      // Add screen glow
      const screenGeometry = new THREE.PlaneGeometry(0.6, 0.4);
      const screenMaterial = new THREE.MeshBasicMaterial({
        color: this.config.glowColor,
        transparent: true,
        opacity: 0.8,
      });
      const screen = new THREE.Mesh(screenGeometry, screenMaterial);
      screen.position.set(0, 0.3, 0.16);
      terminal.add(screen);
    });
  }

  private addBarrels(): void {
    // Add explosive barrels throughout the map
    for (let i = 0; i < 8; i++) {
      const barrelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 8);
      const barrelMaterial = new THREE.MeshLambertMaterial({
        color: 0x8b4513,
      });
      const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
      
      // Position randomly in hallways and rooms
      const roomsArray = Array.from(this.rooms.values());
      const randomRoom = roomsArray[Math.floor(Math.random() * roomsArray.length)];
      if (randomRoom) {
        barrel.position.set(
          randomRoom.position.x + (Math.random() - 0.5) * randomRoom.size.x * 0.5,
          randomRoom.elevation + 0.6,
          randomRoom.position.z + (Math.random() - 0.5) * randomRoom.size.z * 0.5
        );
      }
      barrel.castShadow = true;
      barrel.receiveShadow = true;
      this.addCollidableObject(barrel, "interactive");
    }
  }

  private addTechPanels(): void {
    // Add wall-mounted tech panels
    this.rooms.forEach((room) => {
      if (Math.random() > 0.6) return; // Not every room gets panels
      
      const panelGeometry = new THREE.BoxGeometry(1.5, 1, 0.1);
      const panelMaterial = new THREE.MeshLambertMaterial({
        color: 0x4a4a4a,
      });
      const panel = new THREE.Mesh(panelGeometry, panelMaterial);
      
      // Mount on wall
      panel.position.set(
        room.position.x - room.size.x * 0.45,
        room.elevation + 2,
        room.position.z
      );
      panel.castShadow = true;
      panel.receiveShadow = true;
      this.scene.add(panel);

      // Add blinking lights
      for (let i = 0; i < 3; i++) {
        const lightGeometry = new THREE.SphereGeometry(0.05, 8, 6);
        const lightMaterial = new THREE.MeshBasicMaterial({
          color: [0xff0000, 0x00ff00, 0x0000ff][i],
        });
        const light = new THREE.Mesh(lightGeometry, lightMaterial);
        light.position.set((i - 1) * 0.4, 0.2, 0.06);
        panel.add(light);
      }
    });
  }

  addGroundDetails(): void {
    this.addFloorTextures();
    this.addScuffMarks();
    this.addGrateAreas();
  }

  private addFloorTextures(): void {
    // Add texture variations to different floor sectors
    this.rooms.forEach((room) => {
      if (Math.random() > 0.7) return; // Not all rooms get extra textures
      
      const textureGeometry = new THREE.PlaneGeometry(
        room.size.x * 0.8,
        room.size.z * 0.8
      );
      const textureColors = [0x2a2a2a, 0x3a3a3a, 0x1a1a1a];
      const textureMaterial = new THREE.MeshLambertMaterial({
        color: textureColors[Math.floor(Math.random() * textureColors.length)],
        transparent: true,
        opacity: 0.7,
      });
      
      const texture = new THREE.Mesh(textureGeometry, textureMaterial);
      texture.rotation.x = -Math.PI / 2;
      texture.position.set(
        room.position.x,
        room.elevation + 0.01,
        room.position.z
      );
      texture.receiveShadow = true;
      this.addGroundTextureObject(texture);
    });
  }

  private addScuffMarks(): void {
    // Add battle damage and scuff marks
    for (let i = 0; i < 15; i++) {
      const scuffGeometry = new THREE.CircleGeometry(Math.random() * 2 + 0.5, 8);
      const scuffMaterial = new THREE.MeshBasicMaterial({
        color: 0x1a1a1a,
        transparent: true,
        opacity: 0.4,
      });
      
      const scuff = new THREE.Mesh(scuffGeometry, scuffMaterial);
      scuff.rotation.x = -Math.PI / 2;
      
      // Position randomly throughout the map
      const roomsArray = Array.from(this.rooms.values());
      const randomRoom = roomsArray[Math.floor(Math.random() * roomsArray.length)];
      if (randomRoom) {
        scuff.position.set(
          randomRoom.position.x + (Math.random() - 0.5) * randomRoom.size.x,
          randomRoom.elevation + 0.02,
          randomRoom.position.z + (Math.random() - 0.5) * randomRoom.size.z
        );
      }
      this.addGroundTextureObject(scuff);
    }
  }

  private addGrateAreas(): void {
    // Add metal grating in some areas
    const grateRooms = ["north_corridor", "west_wing"];
    
    grateRooms.forEach(roomId => {
      const room = this.rooms.get(roomId);
      if (!room) return;
      
      const grateGeometry = new THREE.PlaneGeometry(4, 4);
      const grateMaterial = new THREE.MeshLambertMaterial({
        color: 0x4a4a4a,
        transparent: true,
        opacity: 0.8,
      });
      
      const grate = new THREE.Mesh(grateGeometry, grateMaterial);
      grate.rotation.x = -Math.PI / 2;
      grate.position.set(
        room.position.x,
        room.elevation + 0.05,
        room.position.z
      );
      grate.receiveShadow = true;
      this.addGroundTextureObject(grate);
    });
  }

  // Minimap system
  private setupMinimap(): void {
    // Replace the radar with a minimap showing the actual map layout
    setTimeout(() => {
      this.initializeMinimap();
    }, 1000); // Delay to ensure DOM is ready
  }

  private initializeMinimap(): void {
    const radarCanvas = document.getElementById("radarCanvas") as HTMLCanvasElement;
    if (!radarCanvas) {
      console.warn("Radar canvas not found for minimap");
      return;
    }

    // Store original radar update function and replace it
    const originalUpdateRadar = (window as any).updateRadar;
    (window as any).updateRadar = (playerPos: THREE.Vector3, demons: any[], camera: THREE.Camera) => {
      this.updateMinimap(radarCanvas, playerPos, demons, camera);
    };

    console.log("🗺️ Minimap system initialized for Doom Map");
  }

  private updateMinimap(canvas: HTMLCanvasElement, playerPos: THREE.Vector3, demons: any[], camera: THREE.Camera): void {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Map bounds and scale
    const mapBounds = { minX: -80, maxX: 60, minZ: -70, maxZ: 50 };
    const scaleX = canvas.width / (mapBounds.maxX - mapBounds.minX);
    const scaleZ = canvas.height / (mapBounds.maxZ - mapBounds.minZ);

    // Helper function to convert world coordinates to canvas coordinates
    const worldToCanvas = (worldX: number, worldZ: number) => {
      const canvasX = ((worldX - mapBounds.minX) * scaleX);
      const canvasY = ((worldZ - mapBounds.minZ) * scaleZ);
      return { x: canvasX, y: canvas.height - canvasY }; // Flip Y axis
    };

    // Draw room outlines
    this.rooms.forEach((room) => {
      const roomCorner = worldToCanvas(
        room.position.x - room.size.x / 2,
        room.position.z - room.size.z / 2
      );
      const roomSize = {
        width: room.size.x * scaleX,
        height: room.size.z * scaleZ
      };

      // Room fill based on type
      let fillColor = "rgba(100, 100, 100, 0.3)";
      switch (room.type) {
        case "start": fillColor = "rgba(0, 100, 255, 0.4)"; break;
        case "boss": fillColor = "rgba(255, 0, 100, 0.4)"; break;
        case "secret": fillColor = "rgba(0, 255, 100, 0.4)"; break;
        case "exit": fillColor = "rgba(100, 200, 255, 0.4)"; break;
      }

      ctx.fillStyle = fillColor;
      ctx.fillRect(roomCorner.x, roomCorner.y, roomSize.width, roomSize.height);

      // Room outline
      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = 1;
      ctx.strokeRect(roomCorner.x, roomCorner.y, roomSize.width, roomSize.height);
    });

    // Draw hallways
    this.hallways.forEach((hallway) => {
      const start = worldToCanvas(hallway.start.x, hallway.start.z);
      const end = worldToCanvas(hallway.end.x, hallway.end.z);

      ctx.strokeStyle = "rgba(200, 200, 200, 0.5)";
      ctx.lineWidth = Math.max(2, hallway.width * Math.min(scaleX, scaleZ) * 0.3);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    });

    // Draw demons
    demons.forEach((demon) => {
      if (demon.position) {
        const demonPos = worldToCanvas(demon.position.x, demon.position.z);
        ctx.fillStyle = "rgba(255, 0, 0, 0.8)";
        ctx.beginPath();
        ctx.arc(demonPos.x, demonPos.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw player
    const playerCanvasPos = worldToCanvas(playerPos.x, playerPos.z);
    
    // Player dot
    ctx.fillStyle = "rgba(0, 255, 0, 1)";
    ctx.beginPath();
    ctx.arc(playerCanvasPos.x, playerCanvasPos.y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Player direction indicator
    if (camera) {
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      const angle = Math.atan2(direction.x, direction.z);
      const lineLength = 12;

      ctx.strokeStyle = "rgba(0, 255, 0, 1)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playerCanvasPos.x, playerCanvasPos.y);
      ctx.lineTo(
        playerCanvasPos.x + Math.sin(angle) * lineLength,
        playerCanvasPos.y - Math.cos(angle) * lineLength
      );
      ctx.stroke();
    }

    // Draw minimap border
    ctx.strokeStyle = "rgba(0, 255, 0, 0.8)";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
  }

  // Helper methods
  private createWall(width: number, height: number, depth: number, position: THREE.Vector3, material: THREE.Material): THREE.Mesh {
    const wallGeometry = new THREE.BoxGeometry(width, height, depth);
    const wall = new THREE.Mesh(wallGeometry, material);
    wall.position.copy(position);
    wall.castShadow = true;
    wall.receiveShadow = true;
    return wall;
  }

  private getRoomWallColor(roomType: string): number {
    switch (roomType) {
      case "boss": return 0x660000;
      case "secret": return 0x006600;
      case "start": return 0x000066;
      case "exit": return 0x404080;
      default: return this.config.secondaryColor;
    }
  }

  private adjustColorForElevation(baseColor: number, elevation: number): number {
    // Adjust color brightness based on elevation
    const factor = 1 + (elevation * 0.1);
    const r = Math.min(255, ((baseColor >> 16) & 0xff) * factor);
    const g = Math.min(255, ((baseColor >> 8) & 0xff) * factor);
    const b = Math.min(255, (baseColor & 0xff) * factor);
    return (r << 16) | (g << 8) | b;
  }
} 
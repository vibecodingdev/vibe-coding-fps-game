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
  private doorWidth = 5; // Increased door width
  private minCorridorWidth = 8; // Minimum corridor width to prevent getting stuck

  constructor(scene: THREE.Scene) {
    const config: SceneThemeConfig = {
      name: "Doom Maze",
      primaryColor: 0x707070, // Brighter gray like Industrial theme
      secondaryColor: 0x808080, // Lighter walls
      fogColor: 0x606060, // Much lighter fog
      ambientLightColor: 0x888888, // Brighter ambient
      directionalLightColor: 0xffffff, // White directional light
      fillLightColor: 0xcccccc, // Bright fill light
      groundColor: 0x666666, // Brighter floor
      skyColor: 0x404040, // Lighter sky
      glowColor: 0x00ccff, // Industrial blue glow
      accentColor: 0xff6600, // Orange accents
    };
    super(scene, config);
    this.initializeSimplifiedMazeLayout();
  }

  private initializeSimplifiedMazeLayout(): void {
    // Simplified maze-like layout with wider paths and clearer structure
    // Grid-based design for easier navigation

    // Starting area (entrance)
    this.rooms.set("start", {
      id: "start",
      position: new THREE.Vector3(0, 0, -40),
      size: new THREE.Vector3(16, this.wallHeight, 16),
      type: "start",
      connections: ["north_corridor"],
      elevation: 0,
      lighting: { color: 0x4080ff, intensity: 2.0 },
    });

    // Main north corridor
    this.rooms.set("north_corridor", {
      id: "north_corridor",
      position: new THREE.Vector3(0, 0, -15),
      size: new THREE.Vector3(12, this.wallHeight, 30),
      type: "normal",
      connections: ["start", "central_hub"],
      elevation: 0,
      lighting: { color: 0xffffff, intensity: 2.0 },
    });

    // Central hub (main junction)
    this.rooms.set("central_hub", {
      id: "central_hub",
      position: new THREE.Vector3(0, 0, 10),
      size: new THREE.Vector3(20, this.wallHeight, 20),
      type: "normal",
      connections: [
        "north_corridor",
        "east_wing",
        "west_wing",
        "south_passage",
      ],
      elevation: 0,
      lighting: { color: 0xffffff, intensity: 2.5 },
    });

    // East wing
    this.rooms.set("east_wing", {
      id: "east_wing",
      position: new THREE.Vector3(30, 0, 10),
      size: new THREE.Vector3(16, this.wallHeight, 16),
      type: "normal",
      connections: ["central_hub", "east_corridor"],
      elevation: 0,
      lighting: { color: 0xffffff, intensity: 2.0 },
    });

    // East corridor leading to boss
    this.rooms.set("east_corridor", {
      id: "east_corridor",
      position: new THREE.Vector3(50, 0, 10),
      size: new THREE.Vector3(12, this.wallHeight, 25),
      type: "normal",
      connections: ["east_wing", "boss_chamber"],
      elevation: 0,
      lighting: { color: 0xffffff, intensity: 2.0 },
    });

    // Boss chamber
    this.rooms.set("boss_chamber", {
      id: "boss_chamber",
      position: new THREE.Vector3(65, 1, 10),
      size: new THREE.Vector3(18, this.wallHeight + 2, 18),
      type: "boss",
      connections: ["east_corridor"],
      elevation: 1,
      lighting: { color: 0xff4040, intensity: 2.5 },
    });

    // West wing
    this.rooms.set("west_wing", {
      id: "west_wing",
      position: new THREE.Vector3(-30, 0, 10),
      size: new THREE.Vector3(16, this.wallHeight, 16),
      type: "normal",
      connections: ["central_hub", "west_corridor"],
      elevation: 0,
      lighting: { color: 0xffffff, intensity: 2.0 },
    });

    // West corridor
    this.rooms.set("west_corridor", {
      id: "west_corridor",
      position: new THREE.Vector3(-50, 0, 10),
      size: new THREE.Vector3(12, this.wallHeight, 25),
      type: "normal",
      connections: ["west_wing", "secret_area"],
      elevation: 0,
      lighting: { color: 0xffffff, intensity: 2.0 },
    });

    // Secret area
    this.rooms.set("secret_area", {
      id: "secret_area",
      position: new THREE.Vector3(-65, 0, 10),
      size: new THREE.Vector3(14, this.wallHeight, 14),
      type: "secret",
      connections: ["west_corridor"],
      elevation: 0,
      lighting: { color: 0x40ff80, intensity: 2.2 },
    });

    // South passage
    this.rooms.set("south_passage", {
      id: "south_passage",
      position: new THREE.Vector3(0, 0, 35),
      size: new THREE.Vector3(12, this.wallHeight, 25),
      type: "normal",
      connections: ["central_hub", "south_area"],
      elevation: 0,
      lighting: { color: 0xffffff, intensity: 2.0 },
    });

    // South area with exit
    this.rooms.set("south_area", {
      id: "south_area",
      position: new THREE.Vector3(0, 0, 60),
      size: new THREE.Vector3(20, this.wallHeight, 16),
      type: "normal",
      connections: ["south_passage", "exit_area"],
      elevation: 0,
      lighting: { color: 0xffffff, intensity: 2.0 },
    });

    // Exit area
    this.rooms.set("exit_area", {
      id: "exit_area",
      position: new THREE.Vector3(0, 1, 80),
      size: new THREE.Vector3(16, this.wallHeight, 12),
      type: "exit",
      connections: ["south_area"],
      elevation: 1,
      lighting: { color: 0x80c0ff, intensity: 2.5 },
    });

    // Additional side rooms for maze complexity
    this.rooms.set("east_side_room", {
      id: "east_side_room",
      position: new THREE.Vector3(30, 0, 40),
      size: new THREE.Vector3(14, this.wallHeight, 12),
      type: "normal",
      connections: ["east_wing"],
      elevation: 0,
      lighting: { color: 0xffffff, intensity: 2.0 },
    });

    this.rooms.set("west_side_room", {
      id: "west_side_room",
      position: new THREE.Vector3(-30, 0, 40),
      size: new THREE.Vector3(14, this.wallHeight, 12),
      type: "normal",
      connections: ["west_wing"],
      elevation: 0,
      lighting: { color: 0xffffff, intensity: 2.0 },
    });

    // Initialize simplified hallways
    this.initializeSimplifiedHallways();
  }

  private initializeSimplifiedHallways(): void {
    // Wider hallways to prevent getting stuck
    this.hallways = [
      // Start to north corridor
      {
        id: "start_to_north",
        start: new THREE.Vector3(0, 0, -32),
        end: new THREE.Vector3(0, 0, -30),
        width: this.minCorridorWidth,
        height: this.wallHeight,
        doors: false,
      },
      // North corridor to central hub
      {
        id: "north_to_central",
        start: new THREE.Vector3(0, 0, 0),
        end: new THREE.Vector3(0, 0, 0),
        width: this.minCorridorWidth,
        height: this.wallHeight,
        doors: false,
      },
      // Central hub to east wing
      {
        id: "central_to_east",
        start: new THREE.Vector3(10, 0, 10),
        end: new THREE.Vector3(22, 0, 10),
        width: this.minCorridorWidth,
        height: this.wallHeight,
        doors: false,
      },
      // East wing to east corridor
      {
        id: "east_to_corridor",
        start: new THREE.Vector3(38, 0, 10),
        end: new THREE.Vector3(44, 0, 10),
        width: this.minCorridorWidth,
        height: this.wallHeight,
        doors: false,
      },
      // East corridor to boss
      {
        id: "corridor_to_boss",
        start: new THREE.Vector3(56, 0, 10),
        end: new THREE.Vector3(56, 1, 10),
        width: this.minCorridorWidth,
        height: this.wallHeight,
        doors: true,
      },
      // Central hub to west wing
      {
        id: "central_to_west",
        start: new THREE.Vector3(-10, 0, 10),
        end: new THREE.Vector3(-22, 0, 10),
        width: this.minCorridorWidth,
        height: this.wallHeight,
        doors: false,
      },
      // West wing to west corridor
      {
        id: "west_to_corridor",
        start: new THREE.Vector3(-38, 0, 10),
        end: new THREE.Vector3(-44, 0, 10),
        width: this.minCorridorWidth,
        height: this.wallHeight,
        doors: false,
      },
      // West corridor to secret
      {
        id: "corridor_to_secret",
        start: new THREE.Vector3(-56, 0, 10),
        end: new THREE.Vector3(-58, 0, 10),
        width: this.minCorridorWidth,
        height: this.wallHeight,
        doors: true,
      },
      // Central hub to south passage
      {
        id: "central_to_south",
        start: new THREE.Vector3(0, 0, 20),
        end: new THREE.Vector3(0, 0, 22),
        width: this.minCorridorWidth,
        height: this.wallHeight,
        doors: false,
      },
      // South passage to south area
      {
        id: "south_to_area",
        start: new THREE.Vector3(0, 0, 47),
        end: new THREE.Vector3(0, 0, 52),
        width: this.minCorridorWidth,
        height: this.wallHeight,
        doors: false,
      },
      // South area to exit
      {
        id: "area_to_exit",
        start: new THREE.Vector3(0, 0, 68),
        end: new THREE.Vector3(0, 1, 74),
        width: this.minCorridorWidth,
        height: this.wallHeight,
        doors: true,
      },
      // Side room connections
      {
        id: "east_to_side",
        start: new THREE.Vector3(30, 0, 18),
        end: new THREE.Vector3(30, 0, 34),
        width: 6,
        height: this.wallHeight,
        doors: false,
      },
      {
        id: "west_to_side",
        start: new THREE.Vector3(-30, 0, 18),
        end: new THREE.Vector3(-30, 0, 34),
        width: 6,
        height: this.wallHeight,
        doors: false,
      },
    ];
  }

  createAtmosphere(): void {
    // Much lighter fog for better visibility
    const fog = new THREE.Fog(this.config.fogColor, 100, 300);
    this.scene.fog = fog;

    // Add subtle atmospheric particles with brighter color
    const particleSystem = this.createParticleSystem(30, 0xcccccc, 1, 0.3);
    this.scene.add(particleSystem);
  }

  createGround(): THREE.Mesh {
    // Create sectored floor system like classic Doom
    const groundGroup = new THREE.Group();

    // Create individual floor sectors for each room
    this.rooms.forEach((room) => {
      const floorGeometry = new THREE.PlaneGeometry(room.size.x, room.size.z);
      const floorMaterial = new THREE.MeshLambertMaterial({
        color: this.adjustColorForElevation(
          this.config.groundColor,
          room.elevation
        ),
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
      const midPoint = new THREE.Vector3()
        .addVectors(hallway.start, hallway.end)
        .multiplyScalar(0.5);
      floor.position.copy(midPoint);

      const direction = new THREE.Vector3().subVectors(
        hallway.end,
        hallway.start
      );
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
    // Much brighter ambient lighting like Industrial theme
    const ambientLight = new THREE.AmbientLight(
      this.config.ambientLightColor,
      1.8
    );
    this.scene.add(ambientLight);

    // Bright white main directional light
    const directionalLight = new THREE.DirectionalLight(
      this.config.directionalLightColor,
      2.0
    );
    directionalLight.position.set(50, 120, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -150;
    directionalLight.shadow.camera.right = 150;
    directionalLight.shadow.camera.top = 150;
    directionalLight.shadow.camera.bottom = -150;
    this.scene.add(directionalLight);

    // Bright fill light for even coverage
    const fillLight = new THREE.DirectionalLight(
      this.config.fillLightColor,
      1.2
    );
    fillLight.position.set(-50, 100, -50);
    this.scene.add(fillLight);

    // Additional hemisphere light for clean atmosphere
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x888888, 0.6);
    this.scene.add(hemisphereLight);

    // Bright room lighting for each room
    this.rooms.forEach((room) => {
      // Main room light - much brighter
      const roomLight = new THREE.PointLight(
        room.lighting.color,
        room.lighting.intensity * 2.5, // Even brighter
        room.size.x * 2.5 // Larger range
      );
      roomLight.position.set(
        room.position.x,
        room.elevation + this.wallHeight * 0.7,
        room.position.z
      );
      this.scene.add(roomLight);

      // Additional corner lights for full coverage
      const cornerPositions = [
        {
          x: room.position.x + room.size.x * 0.3,
          z: room.position.z + room.size.z * 0.3,
        },
        {
          x: room.position.x - room.size.x * 0.3,
          z: room.position.z + room.size.z * 0.3,
        },
        {
          x: room.position.x + room.size.x * 0.3,
          z: room.position.z - room.size.z * 0.3,
        },
        {
          x: room.position.x - room.size.x * 0.3,
          z: room.position.z - room.size.z * 0.3,
        },
      ];

      cornerPositions.forEach((pos) => {
        const cornerLight = new THREE.PointLight(0xffffff, 1.5, room.size.x);
        cornerLight.position.set(pos.x, room.elevation + 5, pos.z);
        this.scene.add(cornerLight);
      });
    });

    // Bright hallway lighting - no flickering for better visibility
    this.hallways.forEach((hallway) => {
      const midPoint = new THREE.Vector3()
        .addVectors(hallway.start, hallway.end)
        .multiplyScalar(0.5);

      // Main hallway light
      const hallwayLight = new THREE.PointLight(
        0xffffff,
        3.0,
        hallway.width * 4
      );
      hallwayLight.position.set(midPoint.x, 6, midPoint.z);
      this.scene.add(hallwayLight);

      // Additional lights along the hallway for full coverage
      const direction = new THREE.Vector3().subVectors(
        hallway.end,
        hallway.start
      );
      const length = direction.length();
      const segments = Math.max(2, Math.floor(length / 8));

      for (let i = 1; i < segments; i++) {
        const segmentPos = new THREE.Vector3()
          .copy(hallway.start)
          .add(direction.clone().multiplyScalar(i / segments));

        const segmentLight = new THREE.PointLight(
          0xffffff,
          2.0,
          hallway.width * 2
        );
        segmentLight.position.set(segmentPos.x, 5, segmentPos.z);
        this.scene.add(segmentLight);
      }
    });

    // Comprehensive lighting grid for guaranteed visibility
    for (let x = -80; x <= 80; x += 20) {
      for (let z = -50; z <= 90; z += 20) {
        const gridLight = new THREE.PointLight(0xcccccc, 1.2, 30);
        gridLight.position.set(x, 10, z);
        this.scene.add(gridLight);
      }
    }

    console.log(
      "🏛️ Doom Maze lighting system initialized with industrial-grade visibility"
    );
  }

  addEnvironmentObjects(): void {
    this.createRoomWalls();
    this.createHallwayWalls();
    this.createDoors();
    this.createSimplifiedRoomDetails();
    this.createMinimalDecorations();
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
        room.size.x,
        room.size.y,
        wallThickness,
        new THREE.Vector3(
          room.position.x,
          room.position.y + room.size.y / 2,
          room.position.z + room.size.z / 2
        ),
        wallMaterial
      );
      wallGroup.add(northWall);

      // South wall
      const southWall = this.createWall(
        room.size.x,
        room.size.y,
        wallThickness,
        new THREE.Vector3(
          room.position.x,
          room.position.y + room.size.y / 2,
          room.position.z - room.size.z / 2
        ),
        wallMaterial
      );
      wallGroup.add(southWall);

      // East wall
      const eastWall = this.createWall(
        wallThickness,
        room.size.y,
        room.size.z,
        new THREE.Vector3(
          room.position.x + room.size.x / 2,
          room.position.y + room.size.y / 2,
          room.position.z
        ),
        wallMaterial
      );
      wallGroup.add(eastWall);

      // West wall
      const westWall = this.createWall(
        wallThickness,
        room.size.y,
        room.size.z,
        new THREE.Vector3(
          room.position.x - room.size.x / 2,
          room.position.y + room.size.y / 2,
          room.position.z
        ),
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
      const direction = new THREE.Vector3()
        .subVectors(hallway.end, hallway.start)
        .normalize();
      const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);

      const wallMaterial = new THREE.MeshLambertMaterial({
        color: this.config.secondaryColor,
      });

      // Create two parallel walls for the hallway
      const wallThickness = 0.3;

      // Left wall
      const leftWallGeometry = new THREE.BoxGeometry(
        wallThickness,
        hallway.height,
        length
      );
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
      const rightWallGeometry = new THREE.BoxGeometry(
        wallThickness,
        hallway.height,
        length
      );
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
    this.hallways
      .filter((h) => h.doors)
      .forEach((hallway) => {
        const midPoint = new THREE.Vector3()
          .addVectors(hallway.start, hallway.end)
          .multiplyScalar(0.5);
        const direction = new THREE.Vector3()
          .subVectors(hallway.end, hallway.start)
          .normalize();

        const doorFrameGeometry = new THREE.BoxGeometry(
          this.doorWidth,
          this.doorHeight,
          0.2
        );
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

  private createSimplifiedRoomDetails(): void {
    this.rooms.forEach((room) => {
      // Simplified room details for better navigation
      switch (room.type) {
        case "boss":
          this.createSimplifiedBossRoom(room);
          break;
        case "secret":
          this.createSimplifiedSecretRoom(room);
          break;
        case "start":
          this.createSimplifiedStartRoom(room);
          break;
        case "exit":
          this.createSimplifiedExitRoom(room);
          break;
        default:
          this.createSimplifiedNormalRoom(room);
      }
    });
  }

  private createSimplifiedBossRoom(room: RoomData): void {
    // Simple elevated platform
    const platformGeometry = new THREE.CylinderGeometry(2, 2.5, 0.5, 8);
    const platformMaterial = new THREE.MeshLambertMaterial({
      color: 0x888888,
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(
      room.position.x,
      room.elevation + 0.25,
      room.position.z
    );
    platform.castShadow = true;
    platform.receiveShadow = true;
    this.addCollidableObject(platform, "static");
  }

  private createSimplifiedSecretRoom(room: RoomData): void {
    // Simple glowing indicator
    const treasureGeometry = new THREE.SphereGeometry(0.5, 8, 6);
    const treasureMaterial = new THREE.MeshBasicMaterial({
      color: this.config.glowColor,
      transparent: true,
      opacity: 0.8,
    });
    const treasure = new THREE.Mesh(treasureGeometry, treasureMaterial);
    treasure.position.set(room.position.x, room.elevation + 1, room.position.z);
    this.scene.add(treasure);
  }

  private createSimplifiedStartRoom(room: RoomData): void {
    // Simple spawn marker
    const spawnGeometry = new THREE.CircleGeometry(1, 16);
    const spawnMaterial = new THREE.MeshBasicMaterial({
      color: 0x4080ff,
      transparent: true,
      opacity: 0.5,
    });
    const spawn = new THREE.Mesh(spawnGeometry, spawnMaterial);
    spawn.rotation.x = -Math.PI / 2;
    spawn.position.set(room.position.x, room.elevation + 0.01, room.position.z);
    this.scene.add(spawn);
  }

  private createSimplifiedExitRoom(room: RoomData): void {
    // Simple exit marker
    const portalGeometry = new THREE.CircleGeometry(1.5, 16);
    const portalMaterial = new THREE.MeshBasicMaterial({
      color: 0x80c0ff,
      transparent: true,
      opacity: 0.6,
    });
    const portal = new THREE.Mesh(portalGeometry, portalMaterial);
    portal.rotation.x = -Math.PI / 2;
    portal.position.set(
      room.position.x,
      room.elevation + 0.01,
      room.position.z
    );
    this.scene.add(portal);
  }

  private createSimplifiedNormalRoom(room: RoomData): void {
    // Minimal decoration - just one simple object if any
    if (Math.random() > 0.7) {
      const objectGeometry = new THREE.BoxGeometry(1, 1, 1);
      const objectMaterial = new THREE.MeshLambertMaterial({
        color: 0x888888,
      });
      const object = new THREE.Mesh(objectGeometry, objectMaterial);
      object.position.set(
        room.position.x + (Math.random() - 0.5) * room.size.x * 0.3,
        room.elevation + 0.5,
        room.position.z + (Math.random() - 0.5) * room.size.z * 0.3
      );
      object.castShadow = true;
      object.receiveShadow = true;
      this.addCollidableObject(object, "static");
    }
  }

  private createMinimalDecorations(): void {
    // Add only essential decorations to avoid clutter
    this.addSimpleWaypoints();
  }

  private addSimpleWaypoints(): void {
    // Add minimal waypoint markers for navigation
    this.hallways.forEach((hallway, index) => {
      if (index % 2 === 0) return; // Only add to every other hallway

      const midPoint = new THREE.Vector3()
        .addVectors(hallway.start, hallway.end)
        .multiplyScalar(0.5);

      const markerGeometry = new THREE.SphereGeometry(0.2, 8, 6);
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: this.config.glowColor,
        transparent: true,
        opacity: 0.6,
      });

      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(midPoint.x, 2, midPoint.z);
      this.scene.add(marker);
    });
  }

  addGroundDetails(): void {
    this.addSimpleFloorTextures();
  }

  private addSimpleFloorTextures(): void {
    // Minimal floor textures for visual interest without clutter
    this.rooms.forEach((room) => {
      if (
        room.type === "start" ||
        room.type === "exit" ||
        room.type === "boss"
      ) {
        const textureGeometry = new THREE.PlaneGeometry(
          room.size.x * 0.6,
          room.size.z * 0.6
        );
        const textureMaterial = new THREE.MeshLambertMaterial({
          color: 0x555555,
          transparent: true,
          opacity: 0.3,
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
      }
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
    const radarCanvas = document.getElementById(
      "radarCanvas"
    ) as HTMLCanvasElement;
    if (!radarCanvas) {
      console.warn("Radar canvas not found for minimap");
      return;
    }

    // Store original radar update function and replace it
    const originalUpdateRadar = (window as any).updateRadar;
    (window as any).updateRadar = (
      playerPos: THREE.Vector3,
      demons: any[],
      camera: THREE.Camera
    ) => {
      this.updateMinimap(radarCanvas, playerPos, demons, camera);
    };

    console.log("🗺️ Minimap system initialized for Doom Map");
  }

  private updateMinimap(
    canvas: HTMLCanvasElement,
    playerPos: THREE.Vector3,
    demons: any[],
    camera: THREE.Camera
  ): void {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Map bounds and scale for simplified maze
    const mapBounds = { minX: -80, maxX: 80, minZ: -50, maxZ: 90 };
    const scaleX = canvas.width / (mapBounds.maxX - mapBounds.minX);
    const scaleZ = canvas.height / (mapBounds.maxZ - mapBounds.minZ);

    // Helper function to convert world coordinates to canvas coordinates
    const worldToCanvas = (worldX: number, worldZ: number) => {
      const canvasX = (worldX - mapBounds.minX) * scaleX;
      const canvasY = (worldZ - mapBounds.minZ) * scaleZ;
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
        height: room.size.z * scaleZ,
      };

      // Room fill based on type
      let fillColor = "rgba(100, 100, 100, 0.3)";
      switch (room.type) {
        case "start":
          fillColor = "rgba(0, 100, 255, 0.4)";
          break;
        case "boss":
          fillColor = "rgba(255, 0, 100, 0.4)";
          break;
        case "secret":
          fillColor = "rgba(0, 255, 100, 0.4)";
          break;
        case "exit":
          fillColor = "rgba(100, 200, 255, 0.4)";
          break;
      }

      ctx.fillStyle = fillColor;
      ctx.fillRect(roomCorner.x, roomCorner.y, roomSize.width, roomSize.height);

      // Room outline
      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        roomCorner.x,
        roomCorner.y,
        roomSize.width,
        roomSize.height
      );
    });

    // Draw hallways
    this.hallways.forEach((hallway) => {
      const start = worldToCanvas(hallway.start.x, hallway.start.z);
      const end = worldToCanvas(hallway.end.x, hallway.end.z);

      ctx.strokeStyle = "rgba(200, 200, 200, 0.5)";
      ctx.lineWidth = Math.max(
        2,
        hallway.width * Math.min(scaleX, scaleZ) * 0.3
      );
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
  private createWall(
    width: number,
    height: number,
    depth: number,
    position: THREE.Vector3,
    material: THREE.Material
  ): THREE.Mesh {
    const wallGeometry = new THREE.BoxGeometry(width, height, depth);
    const wall = new THREE.Mesh(wallGeometry, material);
    wall.position.copy(position);
    wall.castShadow = true;
    wall.receiveShadow = true;
    return wall;
  }

  private getRoomWallColor(roomType: string): number {
    switch (roomType) {
      case "boss":
        return 0x660000;
      case "secret":
        return 0x006600;
      case "start":
        return 0x000066;
      case "exit":
        return 0x404080;
      default:
        return this.config.secondaryColor;
    }
  }

  private adjustColorForElevation(
    baseColor: number,
    elevation: number
  ): number {
    // Adjust color brightness based on elevation
    const factor = 1 + elevation * 0.1;
    const r = Math.min(255, ((baseColor >> 16) & 0xff) * factor);
    const g = Math.min(255, ((baseColor >> 8) & 0xff) * factor);
    const b = Math.min(255, (baseColor & 0xff) * factor);
    return (r << 16) | (g << 8) | b;
  }
}

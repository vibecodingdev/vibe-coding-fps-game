import * as THREE from "three";

export interface CollisionObject {
  mesh: THREE.Object3D;
  boundingBox: THREE.Box3;
  type: "static" | "interactive" | "decorative";
  onCollision?: (player: THREE.Vector3) => void | undefined;
}

export class CollisionSystem {
  private static instance: CollisionSystem | null = null;
  private collidableObjects: CollisionObject[] = [];
  private readonly COLLISION_MARGIN = 0.3; // Reduced margin for tighter collision detection
  private readonly PLAYER_RADIUS = 0.6; // Reduced player collision radius for better movement
  private readonly TOLERANCE_MARGIN = 0.1; // Allow slight overlap to prevent getting stuck

  private constructor() {}

  public static getInstance(): CollisionSystem {
    if (!CollisionSystem.instance) {
      CollisionSystem.instance = new CollisionSystem();
    }
    return CollisionSystem.instance;
  }

  /**
   * Add a collidable object to the system
   */
  public addCollidableObject(
    mesh: THREE.Object3D,
    type: "static" | "interactive" | "decorative" = "static",
    customBoundingBox?: THREE.Box3,
    onCollision?: (player: THREE.Vector3) => void
  ): void {
    // Calculate or use provided bounding box
    let boundingBox: THREE.Box3;
    if (customBoundingBox) {
      boundingBox = customBoundingBox.clone();
    } else {
      boundingBox = new THREE.Box3().setFromObject(mesh);
      // Expand bounding box slightly for better collision detection
      boundingBox.expandByScalar(this.COLLISION_MARGIN);
    }

    const collisionObject: CollisionObject = {
      mesh,
      boundingBox,
      type,
      ...(onCollision && { onCollision }),
    };

    this.collidableObjects.push(collisionObject);

    console.log(
      `🔧 Added ${type} collision object at position:`,
      mesh.position
    );
  }

  /**
   * Remove a collidable object from the system
   */
  public removeCollidableObject(mesh: THREE.Object3D): void {
    const index = this.collidableObjects.findIndex((obj) => obj.mesh === mesh);
    if (index !== -1) {
      this.collidableObjects.splice(index, 1);
      console.log(`🗑️ Removed collision object from system`);
    }
  }

  /**
   * Clear all collidable objects
   */
  public clearAll(): void {
    this.collidableObjects = [];
    console.log(`🧹 Cleared all collision objects`);
  }

  /**
   * Check if a position would collide with any objects
   */
  public checkCollision(position: THREE.Vector3): CollisionObject | null {
    return this.checkCollisionWithTolerance(position, 0);
  }

  /**
   * Check collision with tolerance for slight overlaps
   */
  public checkCollisionWithTolerance(
    position: THREE.Vector3,
    tolerance: number = 0
  ): CollisionObject | null {
    // Create a bounding box for the player at the given position
    const effectiveRadius = Math.max(0.2, this.PLAYER_RADIUS - tolerance);
    const playerBox = new THREE.Box3().setFromCenterAndSize(
      position,
      new THREE.Vector3(
        effectiveRadius * 2,
        3.2, // Player height (camera at 1.6m, so total height ~3.2m)
        effectiveRadius * 2
      )
    );

    // Check collision with each object
    for (const collisionObject of this.collidableObjects) {
      // Skip decorative objects for movement collision
      if (collisionObject.type === "decorative") continue;

      // Check if player bounding box intersects with object bounding box
      if (playerBox.intersectsBox(collisionObject.boundingBox)) {
        // Trigger collision callback if exists
        if (collisionObject.onCollision) {
          collisionObject.onCollision(position);
        }

        return collisionObject;
      }
    }

    return null;
  }

  /**
   * Check if movement from one position to another would cause collision
   */
  public checkMovementCollision(
    fromPosition: THREE.Vector3,
    toPosition: THREE.Vector3
  ): {
    canMove: boolean;
    adjustedPosition?: THREE.Vector3;
    hitObject?: CollisionObject;
  } {
    const collision = this.checkCollision(toPosition);

    if (!collision) {
      return { canMove: true };
    }

    // Try to find a valid position by sliding along obstacles
    const adjustedPosition = this.findSlidingPosition(
      fromPosition,
      toPosition,
      collision
    );

    if (adjustedPosition) {
      return {
        canMove: true,
        adjustedPosition,
        hitObject: collision,
      };
    }

    return {
      canMove: false,
      hitObject: collision,
    };
  }

  /**
   * Find a position that slides along an obstacle
   */
  private findSlidingPosition(
    fromPosition: THREE.Vector3,
    toPosition: THREE.Vector3,
    obstacle: CollisionObject
  ): THREE.Vector3 | null {
    // Try sliding along X axis only
    const slideX = new THREE.Vector3(
      toPosition.x,
      fromPosition.y,
      fromPosition.z
    );
    if (!this.checkCollision(slideX)) {
      return slideX;
    }

    // Try sliding along Z axis only
    const slideZ = new THREE.Vector3(
      fromPosition.x,
      fromPosition.y,
      toPosition.z
    );
    if (!this.checkCollision(slideZ)) {
      return slideZ;
    }

    // Try partial movement - move a fraction of the intended distance
    const direction = new THREE.Vector3().subVectors(toPosition, fromPosition);
    for (let fraction = 0.8; fraction > 0.1; fraction -= 0.1) {
      const partialPos = fromPosition
        .clone()
        .add(direction.clone().multiplyScalar(fraction));
      if (!this.checkCollision(partialPos)) {
        return partialPos;
      }
    }

    // No valid sliding position found
    return null;
  }

  /**
   * Get all collidable objects of a specific type
   */
  public getCollidableObjects(
    type?: "static" | "interactive" | "decorative"
  ): CollisionObject[] {
    if (type) {
      return this.collidableObjects.filter((obj) => obj.type === type);
    }
    return [...this.collidableObjects];
  }

  /**
   * Check collision with a specific object type only
   */
  public checkCollisionWithType(
    position: THREE.Vector3,
    type: "static" | "interactive" | "decorative"
  ): CollisionObject | null {
    const objectsOfType = this.getCollidableObjects(type);

    // Create player bounding box
    const playerBox = new THREE.Box3().setFromCenterAndSize(
      position,
      new THREE.Vector3(this.PLAYER_RADIUS * 2, 3.2, this.PLAYER_RADIUS * 2)
    );

    for (const collisionObject of objectsOfType) {
      if (playerBox.intersectsBox(collisionObject.boundingBox)) {
        if (collisionObject.onCollision) {
          collisionObject.onCollision(position);
        }
        return collisionObject;
      }
    }

    return null;
  }

  /**
   * Get collision system statistics
   */
  public getStats(): {
    total: number;
    static: number;
    interactive: number;
    decorative: number;
  } {
    const stats = {
      total: this.collidableObjects.length,
      static: 0,
      interactive: 0,
      decorative: 0,
    };

    this.collidableObjects.forEach((obj) => {
      stats[obj.type]++;
    });

    return stats;
  }
}

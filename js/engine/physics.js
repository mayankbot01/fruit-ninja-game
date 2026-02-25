/**
 * physics.js
 * QuadTree + AABB Collision Detection
 *
 * QUADTREE
 * Without QuadTree: O(n^2) per frame for n entities.
 * With    QuadTree: O(n log n) insert + O(k log n) retrieval.
 * SPACE COMPLEXITY: O(n) nodes total.
 *
 * AABB: O(1) per pair - narrow phase after QuadTree broad phase.
 */

// Rectangle helper used as QuadTree boundary
class Rect {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width  = width;
    this.height = height;
  }

  contains(other) {
    return (
      other.x >= this.x &&
      other.y >= this.y &&
      other.x + other.width  <= this.x + this.width &&
      other.y + other.height <= this.y + this.height
    );
  }

  intersects(other) {
    return !(
      other.x > this.x + this.width  ||
      other.x + other.width  < this.x ||
      other.y > this.y + this.height ||
      other.y + other.height < this.y
    );
  }
}

// QuadTree - spatial partitioning for broad-phase collision
class QuadTree {
  /**
   * @param {Rect}   boundary - Region this node covers.
   * @param {number} capacity - Max entities before subdivision.
   * @param {number} maxDepth - Guard against infinite recursion.
   */
  constructor(boundary, capacity = 6, maxDepth = 6) {
    this.boundary = boundary;
    this.capacity = capacity;
    this.maxDepth = maxDepth;
    this.depth    = 0;
    this.entities = [];
    this.children = null; // null = leaf node
  }

  // Remove all entities and collapse child nodes. O(n)
  clear() {
    this.entities = [];
    if (this.children) {
      this.children.forEach(c => c.clear());
      this.children = null;
    }
  }

  // Subdivide into four equal child quadrants. TIME: O(1)
  _split() {
    const { x, y, width, height } = this.boundary;
    const hw = width  / 2;
    const hh = height / 2;

    this.children = [
      new QuadTree(new Rect(x,      y,      hw, hh), this.capacity, this.maxDepth), // NW
      new QuadTree(new Rect(x + hw, y,      hw, hh), this.capacity, this.maxDepth), // NE
      new QuadTree(new Rect(x,      y + hh, hw, hh), this.capacity, this.maxDepth), // SW
      new QuadTree(new Rect(x + hw, y + hh, hw, hh), this.capacity, this.maxDepth), // SE
    ];

    this.children.forEach(c => { c.depth = this.depth + 1; });
    this.entities.forEach(e => this._insertIntoChildren(e));
    this.entities = [];
  }

  _insertIntoChildren(entity) {
    const eRect = new Rect(entity.x, entity.y, entity.width, entity.height);
    for (const child of this.children) {
      if (child.boundary.contains(eRect)) {
        child.insert(entity);
        return true;
      }
    }
    this.entities.push(entity); // straddles boundary - keep at parent
    return false;
  }

  /**
   * Insert entity into the QuadTree.
   * TIME: O(log n) average
   */
  insert(entity) {
    const eRect = new Rect(entity.x, entity.y, entity.width, entity.height);
    if (!this.boundary.intersects(eRect)) return;

    if (this.children) {
      this._insertIntoChildren(entity);
    } else if (this.entities.length < this.capacity || this.depth >= this.maxDepth) {
      this.entities.push(entity);
    } else {
      this._split();
      this._insertIntoChildren(entity);
    }
  }

  /**
   * Retrieve all entities that could collide with queryRect.
   * TIME: O(log n + k) where k = candidates returned.
   */
  retrieve(queryRect) {
    const found = [...this.entities];
    if (this.children) {
      for (const child of this.children) {
        if (child.boundary.intersects(queryRect)) {
          found.push(...child.retrieve(queryRect));
        }
      }
    }
    return found;
  }
}

/**
 * AABB Narrow-Phase Collision Check. TIME: O(1)
 */
function aabbCollides(a, b) {
  return !(
    a.x + a.width  < b.x ||
    b.x + b.width  < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

/**
 * Point-vs-AABB: is point (px, py) inside entity bounding box?
 * TIME: O(1)
 */
function pointInAABB(px, py, entity) {
  return (
    px >= entity.x &&
    px <= entity.x + entity.width  &&
    py >= entity.y &&
    py <= entity.y + entity.height
  );
}

/**
 * entities.js
 * Entity classes, Fruit, Bomb, Particle, BladeTrail + Object Pool
 *
 * OBJECT POOL: Pre-allocates reusable objects to avoid GC pauses.
 * TIME (get/release): O(1) amortized. SPACE: O(P) where P = pool size.
 */

// Base Entity
class Entity {
  constructor() {
    this.x = 0; this.y = 0; this.width = 0; this.height = 0;
    this.velocityX = 0; this.velocityY = 0; this.active = false;
  }
  reset() {
    this.x = this.y = this.width = this.height = 0;
    this.velocityX = this.velocityY = 0; this.active = false;
  }
}

// Object Pool - pre-allocates entities
class ObjectPool {
  constructor(EntityClass, size) {
    this.EntityClass = EntityClass;
    this._available = [];
    this._active = new Set();
    for (let i = 0; i < size; i++) this._available.push(new EntityClass());
  }
  get() {
    let entity = this._available.pop() || new this.EntityClass();
    entity.active = true; this._active.add(entity);
    return entity;
  }
  release(entity) {
    if (!this._active.has(entity)) return;
    entity.reset(); this._active.delete(entity); this._available.push(entity);
  }
  forEach(fn) { this._active.forEach(fn); }
  get activeCount() { return this._active.size; }
}

// Fruit types
const FRUIT_TYPES = [
  { name: 'watermelon', emoji: '🍉', color: '#e84393', radius: 38 },
  { name: 'orange', emoji: '🍊', color: '#ff6b35', radius: 30 },
  { name: 'apple', emoji: '🍎', color: '#e74c3c', radius: 28 },
  { name: 'lemon', emoji: '🍋', color: '#f1c40f', radius: 26 },
  { name: 'pineapple', emoji: '🍍', color: '#e67e22', radius: 32 },
  { name: 'grape', emoji: '🍇', color: '#8e44ad', radius: 24 },
];

class Fruit extends Entity {
  constructor() {
    super(); this.type = null; this.radius = 30; this.angle = 0; this.spin = 0;
    this.sliced = false; this.missed = false; this.sliceProgress = 0;
  }
  init(canvasW, canvasH) {
    this.type = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
    this.radius = this.type.radius; this.width = this.height = this.radius * 2;
    this.x = this.radius + Math.random() * (canvasW - this.radius * 2);
    this.y = canvasH + this.radius;
    const speed = canvasH * (0.65 + Math.random() * 0.35);
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI / 3);
    this.velocityX = Math.cos(angle) * speed * 0.45;
    this.velocityY = Math.sin(angle) * speed;
    this.angle = Math.random() * Math.PI * 2; this.spin = (Math.random() - 0.5) * 4;
    this.sliced = this.missed = false; this.sliceProgress = 0; this.active = true;
  }
  reset() { super.reset(); this.type = null; this.sliced = this.missed = false; this.sliceProgress = 0; }
  update(dt, gravity, canvasH) {
    if (!this.active) return;
    this.velocityY += gravity * dt; this.x += this.velocityX * dt; this.y += this.velocityY * dt;
    this.angle += this.spin * dt;
    if (this.y - this.radius > canvasH + 50) {
      if (!this.sliced) this.missed = true;
      this.active = false;
    }
  }
  draw(ctx) {
    if (!this.active) return;
    const cx = this.x + this.radius, cy = this.y + this.radius;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(this.angle);
    if (!this.sliced) {
      ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.type.color; ctx.shadowColor = this.type.color; ctx.shadowBlur = 18; ctx.fill(); ctx.shadowBlur = 0;
      ctx.font = this.radius * 1.2 + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(this.type.emoji, 0, 0);
    } else {
      const spread = this.sliceProgress * 30;
      ctx.save(); ctx.translate(-spread, 0); ctx.beginPath(); ctx.arc(0, 0, this.radius, Math.PI / 2, -Math.PI / 2); ctx.closePath();
      ctx.fillStyle = this.type.color; ctx.globalAlpha = 1 - this.sliceProgress * 0.8; ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(spread, 0); ctx.beginPath(); ctx.arc(0, 0, this.radius, -Math.PI / 2, Math.PI / 2); ctx.closePath();
      ctx.fillStyle = this.type.color; ctx.globalAlpha = 1 - this.sliceProgress * 0.8; ctx.fill(); ctx.restore();
    }
    ctx.restore();
  }
}

class Bomb extends Entity {
  constructor() {
    super(); this.radius = 28; this.angle = 0; this.spin = 0; this.exploding = false; this.explodeTimer = 0;
  }
  init(canvasW, canvasH) {
    this.radius = 28; this.width = this.height = this.radius * 2;
    this.x = this.radius + Math.random() * (canvasW - this.radius * 2); this.y = canvasH + this.radius;
    const speed = canvasH * (0.6 + Math.random() * 0.3);
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI / 2.5);
    this.velocityX = Math.cos(angle) * speed * 0.4; this.velocityY = Math.sin(angle) * speed;
    this.angle = 0; this.spin = (Math.random() - 0.5) * 3; this.exploding = false; this.explodeTimer = 0; this.active = true;
  }
  reset() { super.reset(); this.exploding = false; this.explodeTimer = 0; }
  update(dt, gravity, canvasH) {
    if (!this.active) return;
    if (this.exploding) { this.explodeTimer += dt; if (this.explodeTimer > 0.6) this.active = false; return; }
    this.velocityY += gravity * dt; this.x += this.velocityX * dt; this.y += this.velocityY * dt; this.angle += this.spin * dt;
    if (this.y - this.radius > canvasH + 50) this.active = false;
  }
  draw(ctx) {
    if (!this.active) return;
    const cx = this.x + this.radius, cy = this.y + this.radius;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(this.angle);
    if (!this.exploding) {
      ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fillStyle = '#1a1a2e';
      ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 3; ctx.shadowColor = '#e74c3c'; ctx.shadowBlur = 12; ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
      ctx.font = this.radius * 1.1 + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('💣', 0, 2);
    } else {
      const t = this.explodeTimer / 0.6, r = this.radius * (1 + t * 3);
      ctx.globalAlpha = 1 - t; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(0,0,0, 0,0,r);
      grad.addColorStop(0, '#fff'); grad.addColorStop(0.3, '#ffd700'); grad.addColorStop(0.7, '#e74c3c'); grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad; ctx.fill();
    }
    ctx.restore();
  }
}

class Particle extends Entity {
  constructor() { super(); this.color = '#fff'; this.life = 0; this.decay = 1; this.size = 4; }
  init(x, y, color) {
    this.x = x; this.y = y; this.width = this.height = this.size; this.color = color; this.life = 1; this.decay = 1.5 + Math.random() * 1.5;
    this.size = 3 + Math.random() * 8;
    const speed = 80 + Math.random() * 220, angle = Math.random() * Math.PI * 2;
    this.velocityX = Math.cos(angle) * speed; this.velocityY = Math.sin(angle) * speed - 60; this.active = true;
  }
  reset() { super.reset(); this.life = 0; }
  update(dt, gravity) {
    if (!this.active) return;
    this.velocityY += gravity * 0.4 * dt; this.x += this.velocityX * dt; this.y += this.velocityY * dt;
    this.life -= this.decay * dt; if (this.life <= 0) { this.life = 0; this.active = false; }
  }
  draw(ctx) {
    if (!this.active || this.life <= 0) return;
    ctx.save(); ctx.globalAlpha = this.life; ctx.beginPath(); ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
    ctx.fillStyle = this.color; ctx.fill(); ctx.restore();
  }
}

class BladeTrail {
  constructor() { this.MAX_POINTS = 18; this.points = []; }
  addPoint(x, y) {
    this.points.push({ x, y, age: 0 }); if (this.points.length > this.MAX_POINTS) this.points.shift();
  }
  update(dt) {
    const FADE_SPEED = 3.5;
    for (const p of this.points) p.age = Math.min(1, p.age + dt * FADE_SPEED);
    this.points = this.points.filter(p => p.age < 1);
  }
  draw(ctx) {
    if (this.points.length < 2) return;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 1; i < this.points.length; i++) {
      const p0 = this.points[i - 1], p1 = this.points[i], alpha = (1 - p1.age) * 0.8, width = (1 - p1.age) * 14;
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y);
      ctx.strokeStyle = 'rgba(255, 255, 220, ' + alpha + ')'; ctx.lineWidth = width; ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, ' + (alpha * 0.6) + ')'; ctx.lineWidth = width * 0.3; ctx.stroke();
    }
    ctx.restore();
  }
}

/**
 * level.js
 * 2D Array / Spatial Grid - Background Tilemap
 *
 * DATA STRUCTURE: grid[row][col] = tileIndex
 * Access: O(1)  Storage: O(R x C)
 */

const TILE = Object.freeze({
  DEEP_SKY: 0, MID_SKY: 1, HORIZON: 2, GROUND: 3,
});

class Level {
  constructor(cols, rows, canvasW, canvasH) {
    this.cols = cols; this.rows = rows;
    this.canvasW = canvasW; this.canvasH = canvasH;
    this.tileW = canvasW / cols; this.tileH = canvasH / rows;
    this.grid = this._buildGrid();
  }

  _buildGrid() {
    const grid = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [], frac = r / this.rows;
      let tileType;
      if (frac < 0.25) tileType = TILE.DEEP_SKY;
      else if (frac < 0.55) tileType = TILE.MID_SKY;
      else if (frac < 0.85) tileType = TILE.HORIZON;
      else tileType = TILE.GROUND;
      for (let c = 0; c < this.cols; c++) row.push(tileType);
      grid.push(row);
    }
    return grid;
  }

  resize(canvasW, canvasH) {
    this.canvasW = canvasW; this.canvasH = canvasH;
    this.tileW = canvasW / this.cols; this.tileH = canvasH / this.rows;
    this.grid = this._buildGrid();
  }

  getTileAt(worldX, worldY) {
    const col = Math.floor(worldX / this.tileW);
    const row = Math.floor(worldY / this.tileH);
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return -1;
    return this.grid[row][col];
  }

  draw(ctx) {
    const tileColors = {
      [TILE.DEEP_SKY]: '#07071a', [TILE.MID_SKY]: '#0f0f2e',
      [TILE.HORIZON]: '#1a0a2e', [TILE.GROUND]: '#120820',
    };
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const tileType = this.grid[r][c];
        ctx.fillStyle = tileColors[tileType];
        ctx.fillRect(c * this.tileW, r * this.tileH, this.tileW + 1, this.tileH + 1);
      }
    }
    // Smooth gradient overlay
    const grad = ctx.createLinearGradient(0, 0, 0, this.canvasH);
    grad.addColorStop(0, 'rgba(5,5,30,0.92)');
    grad.addColorStop(0.4, 'rgba(15,5,40,0.80)');
    grad.addColorStop(0.75, 'rgba(30,5,60,0.72)');
    grad.addColorStop(1, 'rgba(10,0,20,0.96)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, this.canvasW, this.canvasH);
    this._drawStars(ctx);
    // Bottom glow
    const glowGrad = ctx.createLinearGradient(0, this.canvasH - 80, 0, this.canvasH);
    glowGrad.addColorStop(0, 'rgba(100,30,180,0)');
    glowGrad.addColorStop(1, 'rgba(100,30,180,0.35)');
    ctx.fillStyle = glowGrad; ctx.fillRect(0, this.canvasH - 80, this.canvasW, 80);
  }

  _drawStars(ctx) {
    ctx.save();
    for (let r = 0; r < this.rows; r++) {
      if (this.grid[r][0] !== TILE.DEEP_SKY && this.grid[r][0] !== TILE.MID_SKY) continue;
      for (let c = 0; c < this.cols; c++) {
        const seed = (r * 31 + c * 17) % 100;
        if (seed < 12) {
          const sx = (c + (seed * 0.37 % 1)) * this.tileW;
          const sy = (r + (seed * 0.61 % 1)) * this.tileH;
          const radius = 0.5 + (seed % 5) * 0.25;
          const alpha = 0.3 + (seed % 7) * 0.1;
          ctx.beginPath(); ctx.arc(sx, sy, radius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')'; ctx.fill();
        }
      }
    }
    ctx.restore();
  }
}

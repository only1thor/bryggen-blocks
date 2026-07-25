// Bryggen Blocks — Canvas Renderer

let canvas, ctx;
let cellSize = 0;
let boardOffsetX = 0;
let boardOffsetY = 0;

function initCanvas() {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
  const container = document.getElementById('game-container');
  const maxW = container.clientWidth;
  const maxH = container.clientHeight;

  // Reserve: score (40px top) + controls (70px bottom)
  const topPad = 46;
  const botPad = 74;
  const availW = maxW * 0.86;
  const availH = maxH - topPad - botPad;

  const cellFromW = Math.floor(availW / COLS);
  const cellFromH = Math.floor(availH / ROWS);
  cellSize = Math.min(cellFromW, cellFromH, 34);

  const boardW = cellSize * COLS;
  const boardH = cellSize * ROWS;

  boardOffsetX = Math.floor((maxW - boardW) / 2);
  boardOffsetY = topPad + Math.floor((availH - boardH) / 2);

  canvas.width = maxW;
  canvas.height = maxH;
}

// ---- Sky gradient ----

function drawSky() {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.75);
  grad.addColorStop(0, '#3B4A5A');
  grad.addColorStop(0.4, '#2A3540');
  grad.addColorStop(1, '#1A2530');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// ---- Bryggen buildings (drawn behind the board, semi-visible through it) ----

function drawBuildings() {
  const bldgW = canvas.width / BG_BUILDINGS.length;
  const areaTop = boardOffsetY - cellSize * 4;
  const areaBottom = boardOffsetY + cellSize * ROWS + cellSize * 2;
  const areaH = areaBottom - areaTop;

  ctx.globalAlpha = 0.30;

  for (let i = 0; i < BG_BUILDINGS.length; i++) {
    const b = BG_BUILDINGS[i];
    const x = i * bldgW + 2;
    const w = bldgW - 3;
    const h = areaH * b.height;
    const y = areaBottom - h;

    // Building body
    ctx.fillStyle = b.color;
    ctx.fillRect(x, y, w, h);

    // Triangular roof
    ctx.fillStyle = BG_ROOF;
    ctx.beginPath();
    const roofH = Math.max(h * 0.16, 4);
    ctx.moveTo(x - 1, y);
    ctx.lineTo(x + w / 2, y - roofH);
    ctx.lineTo(x + w + 1, y);
    ctx.closePath();
    ctx.fill();

    // Windows
    ctx.fillStyle = 'rgba(255,248,220,0.35)';
    const ws = Math.max(2, w / 8);
    const wg = ws * 3.5;
    for (let wy = y + roofH + wg; wy < y + h - wg; wy += wg) {
      for (let wx = x + wg; wx < x + w - wg; wx += wg) {
        ctx.fillRect(wx, wy, ws, ws);
      }
    }
  }

  // Harbor water at the very bottom
  const waterY = boardOffsetY + cellSize * ROWS + cellSize;
  const gradW = ctx.createLinearGradient(0, waterY, 0, canvas.height);
  gradW.addColorStop(0, 'rgba(74,107,138,0.25)');
  gradW.addColorStop(1, 'rgba(30,50,70,0.40)');
  ctx.fillStyle = gradW;
  ctx.fillRect(0, waterY, canvas.width, canvas.height - waterY);

  ctx.globalAlpha = 1;
}

// ---- Next piece preview (above board) ----

function drawNextPiece() {
  if (!nextPieceType) return;

  const previewSize = cellSize * 0.60;
  const boxW = cellSize * 3;
  const boxH = cellSize * 2;
  const previewX = boardOffsetX + (cellSize * COLS - boxW) / 2;
  const previewY = boardOffsetY - cellSize * 2.8;

  // Label
  ctx.fillStyle = 'rgba(245,240,232,0.5)';
  ctx.font = `${Math.max(10, cellSize * 0.3)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('NEXT', previewX + boxW / 2, previewY - 3);

  // Box with semi-transparent background
  ctx.fillStyle = 'rgba(10,12,25,0.55)';
  ctx.fillRect(previewX, previewY, boxW, boxH);
  ctx.strokeStyle = 'rgba(245,240,232,0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(previewX, previewY, boxW, boxH);

  const shape = getShape(nextPieceType, 0);
  const color = getColor(nextPieceType);
  const pw = shape[0].length * previewSize;
  const ph = shape.length * previewSize;
  const ox = previewX + (boxW - pw) / 2;
  const oy = previewY + (boxH - ph) / 2;

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const x = ox + c * previewSize;
        const y = oy + r * previewSize;
        ctx.fillStyle = color;
        ctx.fillRect(x + 1, y + 1, previewSize - 2, previewSize - 2);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(x + 1, y + 1, previewSize - 2, 1.5);
      }
    }
  }
}

// ---- Board ----

function drawBoard() {
  // Semi-transparent background — buildings show through
  ctx.fillStyle = 'rgba(6,6,20,0.82)';
  ctx.fillRect(boardOffsetX, boardOffsetY, cellSize * COLS, cellSize * ROWS);

  // Border
  ctx.strokeStyle = 'rgba(245,240,232,0.12)';
  ctx.lineWidth = 1;
  ctx.strokeRect(boardOffsetX, boardOffsetY, cellSize * COLS, cellSize * ROWS);

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 0.5;
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(boardOffsetX, boardOffsetY + r * cellSize);
    ctx.lineTo(boardOffsetX + COLS * cellSize, boardOffsetY + r * cellSize);
    ctx.stroke();
  }
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(boardOffsetX + c * cellSize, boardOffsetY);
    ctx.lineTo(boardOffsetX + c * cellSize, boardOffsetY + ROWS * cellSize);
    ctx.stroke();
  }

  // Locked cells
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] !== null) drawCell(r, c, board[r][c], 1);
    }
  }

  // Ghost piece
  if (currentPiece && !gameOver) {
    const gr = ghostRow();
    const shape = getShape(currentPiece.type, currentPiece.rotation);
    const color = getColor(currentPiece.type);
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const br = gr + r;
          if (br >= 0 && br < ROWS) drawCell(br, currentPiece.col + c, color, 0.2);
        }
      }
    }
  }

  // Active piece
  if (currentPiece && !gameOver) {
    const shape = getShape(currentPiece.type, currentPiece.rotation);
    const color = getColor(currentPiece.type);
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const br = currentPiece.row + r;
          if (br >= 0 && br < ROWS) drawCell(br, currentPiece.col + c, color, 1);
        }
      }
    }
  }
}

function drawCell(row, col, color, alpha) {
  const x = boardOffsetX + col * cellSize;
  const y = boardOffsetY + row * cellSize;
  const inset = 1;

  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x + inset, y + inset, cellSize - inset * 2, cellSize - inset * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.20)';
  ctx.fillRect(x + inset, y + inset, cellSize - inset * 2, 2);
  ctx.fillRect(x + inset, y + inset, 2, cellSize - inset * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(x + inset, y + cellSize - inset - 2, cellSize - inset * 2, 2);
  ctx.fillRect(x + cellSize - inset - 2, y + inset, 2, cellSize - inset * 2);
  ctx.globalAlpha = 1;
}

// ---- HUD ----

function drawHUD() {
  var s = (typeof score !== 'undefined') ? score : 0;
  var l = (typeof lines !== 'undefined') ? lines : 0;
  document.getElementById('score-display').textContent = 'Score ' + s + '  \u00b7  Lines ' + l;
}

// ---- Game Over ----

function drawGameOver() {
  ctx.fillStyle = 'rgba(0,0,0,0.80)';
  ctx.fillRect(boardOffsetX, boardOffsetY, cellSize * COLS, cellSize * ROWS);

  var cx = boardOffsetX + cellSize * COLS / 2;
  var cy = boardOffsetY + cellSize * ROWS / 2;

  ctx.fillStyle = '#F5F0E8';
  ctx.font = 'bold ' + (cellSize * 1.2) + 'px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', cx, cy - cellSize * 1.5);

  ctx.font = (cellSize * 0.6) + 'px sans-serif';
  ctx.fillStyle = 'rgba(245,240,232,0.8)';
  var s = (typeof score !== 'undefined') ? score : 0;
  var l = (typeof lines !== 'undefined') ? lines : 0;
  ctx.fillText('Score: ' + s + '  \u00b7  Lines: ' + l, cx, cy + cellSize * 0.3);

  ctx.fillStyle = '#E8C547';
  ctx.font = 'bold ' + (cellSize * 0.55) + 'px sans-serif';
  ctx.fillText('Tap to restart', cx, cy + cellSize * 1.8);
}

// ---- Main render ----

function render() {
  drawNextPiece();
  drawBoard();
  drawHUD();

  if (gameOver) {
    drawGameOver();
  }
}

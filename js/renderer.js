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

  const availH = maxH - 20;
  const cellFromW = Math.floor(maxW * 0.82 / COLS);
  const cellFromH = Math.floor(availH * 0.72 / ROWS);
  cellSize = Math.min(cellFromW, cellFromH, 32);

  const boardW = cellSize * COLS;
  const boardH = cellSize * ROWS;

  boardOffsetX = Math.floor((maxW - boardW) / 2);
  boardOffsetY = Math.floor((availH - boardH) / 2) + 25;

  canvas.width = maxW;
  canvas.height = maxH;
}

// ---- Background: subtle sky ----

function drawSky() {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#2A3040');
  grad.addColorStop(1, '#1A2030');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// ---- Subtle Bryggen buildings (very faint) ----

function drawBuildings() {
  const areaTop = boardOffsetY - cellSize * 2;
  const areaBottom = boardOffsetY;
  const areaH = areaBottom - areaTop;
  const bldgW = canvas.width / BG_BUILDINGS.length;

  ctx.globalAlpha = 0.12;

  for (let i = 0; i < BG_BUILDINGS.length; i++) {
    const b = BG_BUILDINGS[i];
    const x = i * bldgW + 3;
    const w = bldgW - 5;
    const h = areaH * b.height;
    const y = areaBottom - h;

    ctx.fillStyle = b.color;
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = BG_ROOF;
    ctx.beginPath();
    const roofH = h * 0.18;
    ctx.moveTo(x - 1, y);
    ctx.lineTo(x + w / 2, y - roofH);
    ctx.lineTo(x + w + 1, y);
    ctx.closePath();
    ctx.fill();

    // Tiny windows
    ctx.fillStyle = 'rgba(255,255,240,0.25)';
    const ws = Math.max(1.5, w / 10);
    const wg = ws * 3;
    let wi = 0;
    for (let wy = y + roofH + wg; wy < y + h - wg; wy += wg) {
      for (let wx = x + wg; wx < x + w - wg; wx += wg) {
        if ((i + wi) % 3 !== 0) ctx.fillRect(wx, wy, ws, ws);
        wi++;
      }
    }
  }
  ctx.globalAlpha = 1;
}

// ---- Next piece preview (above board, centered horizontally) ----

function drawNextPiece() {
  if (!nextPieceType) return;

  const previewSize = cellSize * 0.65;
  const boxW = cellSize * 3;
  const boxH = cellSize * 2.2;
  const previewX = boardOffsetX + (cellSize * COLS - boxW) / 2;
  const previewY = boardOffsetY - cellSize * 2.6;

  // Label
  ctx.fillStyle = 'rgba(245,240,232,0.4)';
  ctx.font = `${Math.max(9, cellSize * 0.33)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('NEXT', previewX + boxW / 2, previewY - 4);

  // Box
  ctx.strokeStyle = 'rgba(245,240,232,0.12)';
  ctx.lineWidth = 1;
  ctx.strokeRect(previewX, previewY, boxW, boxH);

  // Piece centered in box
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
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(x + 1, y + 1, previewSize - 2, 1.5);
      }
    }
  }
}

// ---- Board rendering ----

function drawBoard() {
  // Board background
  ctx.fillStyle = 'rgba(8, 8, 22, 0.93)';
  ctx.fillRect(boardOffsetX, boardOffsetY, cellSize * COLS, cellSize * ROWS);

  // Border
  ctx.strokeStyle = 'rgba(245,240,232,0.10)';
  ctx.lineWidth = 1;
  ctx.strokeRect(boardOffsetX, boardOffsetY, cellSize * COLS, cellSize * ROWS);

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.035)';
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
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(x + inset, y + inset, cellSize - inset * 2, 2);
  ctx.fillRect(x + inset, y + inset, 2, cellSize - inset * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(x + inset, y + cellSize - inset - 2, cellSize - inset * 2, 2);
  ctx.fillRect(x + cellSize - inset - 2, y + inset, 2, cellSize - inset * 2);
  ctx.globalAlpha = 1;
}

// ---- HUD — score + lines (HTML element, always visible) ----

function drawHUD() {
  var s = (typeof score !== 'undefined') ? score : 0;
  var l = (typeof lines !== 'undefined') ? lines : 0;
  document.getElementById('score-display').textContent = 'Score ' + s + '  \u00b7  Lines ' + l;
}

// ---- Game Over overlay ----

function drawGameOver() {
  ctx.fillStyle = 'rgba(0,0,0,0.78)';
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
  drawSky();
  drawBuildings();
  drawNextPiece();
  drawBoard();
  drawHUD();

  if (gameOver) {
    drawGameOver();
  }
}

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

  // Leave room for controls at bottom and score at top
  const availH = maxH - 20; // padding

  // Board aspect: COLS wide, ROWS tall
  // Try to fill available width and height
  const cellFromW = Math.floor(maxW * 0.85 / COLS);
  const cellFromH = Math.floor(availH * 0.8 / ROWS);
  cellSize = Math.min(cellFromW, cellFromH, 36); // cap at 36px

  const boardW = cellSize * COLS;
  const boardH = cellSize * ROWS;

  boardOffsetX = Math.floor((maxW - boardW) / 2);
  boardOffsetY = Math.floor((availH - boardH) / 2) + 10;

  canvas.width = maxW;
  canvas.height = maxH;
}

// ---- Background: Bryggen Buildings ----

function drawSky() {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#C5D5E0');
  grad.addColorStop(0.6, '#DCE6EE');
  grad.addColorStop(1, '#4A6B8A');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawBuildings() {
  const buildingAreaTop = boardOffsetY - cellSize * 3;
  const buildingAreaBottom = boardOffsetY;
  const buildingHeight = buildingAreaBottom - buildingAreaTop;
  const buildingWidth = canvas.width / BG_BUILDINGS.length;

  for (let i = 0; i < BG_BUILDINGS.length; i++) {
    const b = BG_BUILDINGS[i];
    const x = i * buildingWidth + 4;
    const w = buildingWidth - 6;
    const h = buildingHeight * b.height;
    const y = buildingAreaBottom - h;

    // Building body
    ctx.fillStyle = b.color;
    ctx.fillRect(x, y, w, h);

    // Gable roof (triangle)
    ctx.fillStyle = BG_ROOF;
    ctx.beginPath();
    const roofH = h * 0.2;
    ctx.moveTo(x - 2, y);
    ctx.lineTo(x + w / 2, y - roofH);
    ctx.lineTo(x + w + 2, y);
    ctx.closePath();
    ctx.fill();

    // Windows (small dots grid — seeded by building index for stability)
    ctx.fillStyle = 'rgba(255,255,240,0.4)';
    const winSize = Math.max(2, w / 8);
    const winGap = winSize * 2.5;
    // Simple deterministic check: use (row+col+building_index) % 3
    let wi = 0;
    for (let wy = y + roofH + winGap; wy < y + h - winGap; wy += winGap) {
      for (let wx = x + winGap; wx < x + w - winGap; wx += winGap) {
        if ((i + wi) % 3 !== 0) {
          ctx.fillRect(wx, wy, winSize, winSize);
        }
        wi++;
      }
    }
  }
}

function drawWater() {
  const waterY = boardOffsetY + cellSize * ROWS;
  ctx.fillStyle = BG_WATER;
  ctx.fillRect(0, waterY, canvas.width, canvas.height - waterY);

  // Subtle wave lines
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (let wy = waterY + 10; wy < canvas.height; wy += 20) {
    ctx.beginPath();
    for (let wx = 0; wx < canvas.width; wx += 5) {
      const offset = Math.sin((wx + Date.now() / 500) * 0.02) * 3;
      if (wx === 0) ctx.moveTo(wx, wy + offset);
      else ctx.lineTo(wx, wy + offset);
    }
    ctx.stroke();
  }
}

// ---- Board rendering ----

function drawBoard() {
  // Board background
  ctx.fillStyle = 'rgba(26, 26, 46, 0.85)';
  ctx.fillRect(boardOffsetX, boardOffsetY, cellSize * COLS, cellSize * ROWS);

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
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
      if (board[r][c] !== null) {
        drawCell(r, c, board[r][c], 1);
      }
    }
  }

  // Ghost piece
  if (currentPiece && !gameOver) {
    const ghostR = ghostRow();
    const shape = getShape(currentPiece.type, currentPiece.rotation);
    const color = getColor(currentPiece.type);
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const boardRow = ghostR + r;
          const boardCol = currentPiece.col + c;
          if (boardRow >= 0 && boardRow < ROWS) {
            drawCell(boardRow, boardCol, color, 0.25);
          }
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
          const boardRow = currentPiece.row + r;
          const boardCol = currentPiece.col + c;
          if (boardRow >= 0 && boardRow < ROWS) {
            drawCell(boardRow, boardCol, color, 1);
          }
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

  // Main fill
  ctx.fillStyle = color;
  ctx.fillRect(x + inset, y + inset, cellSize - inset * 2, cellSize - inset * 2);

  // Highlight (top-left bevel)
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(x + inset, y + inset, cellSize - inset * 2, 2);
  ctx.fillRect(x + inset, y + inset, 2, cellSize - inset * 2);

  // Shadow (bottom-right bevel)
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(x + inset, y + cellSize - inset - 2, cellSize - inset * 2, 2);
  ctx.fillRect(x + cellSize - inset - 2, y + inset, 2, cellSize - inset * 2);

  ctx.globalAlpha = 1;
}

// ---- Next piece preview ----

function drawNextPiece() {
  if (!nextPieceType) return;

  const previewX = boardOffsetX + cellSize * COLS + cellSize;
  const previewY = boardOffsetY + cellSize;
  const previewSize = cellSize * 0.8;

  // Label
  ctx.fillStyle = '#F5F0E8';
  ctx.font = `${Math.max(10, cellSize * 0.4)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('Next', previewX + cellSize * 1.5, previewY - 8);

  // Box
  ctx.strokeStyle = 'rgba(245,240,232,0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(previewX, previewY, cellSize * 3, cellSize * 3);

  // Draw piece
  const shape = getShape(nextPieceType, 0);
  const color = getColor(nextPieceType);
  const pieceW = shape[0].length * previewSize;
  const pieceH = shape.length * previewSize;
  const offsetX = previewX + (cellSize * 3 - pieceW) / 2;
  const offsetY = previewY + (cellSize * 3 - pieceH) / 2;

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const x = offsetX + c * previewSize;
        const y = offsetY + r * previewSize;
        ctx.fillStyle = color;
        ctx.fillRect(x + 1, y + 1, previewSize - 2, previewSize - 2);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(x + 1, y + 1, previewSize - 2, 2);
        ctx.fillRect(x + 1, y + 1, 2, previewSize - 2);
      }
    }
  }
}

// ---- Score ----

function drawScore() {
  document.getElementById('score-display').textContent = score;
}

// ---- Game Over overlay ----

function drawGameOver() {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(boardOffsetX, boardOffsetY, cellSize * COLS, cellSize * ROWS);

  ctx.fillStyle = '#F5F0E8';
  ctx.font = `bold ${cellSize * 1.2}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', boardOffsetX + cellSize * COLS / 2, boardOffsetY + cellSize * ROWS / 2 - cellSize);

  ctx.font = `${cellSize * 0.7}px sans-serif`;
  ctx.fillText(`Score: ${score}`, boardOffsetX + cellSize * COLS / 2, boardOffsetY + cellSize * ROWS / 2 + cellSize * 0.5);

  ctx.fillStyle = '#BA3B2E';
  ctx.fillText('Tap to restart', boardOffsetX + cellSize * COLS / 2, boardOffsetY + cellSize * ROWS / 2 + cellSize * 2);
}

// ---- Main render ----

function render() {
  drawSky();
  drawBuildings();
  drawBoard();
  drawNextPiece();
  drawWater();
  drawScore();

  if (gameOver) {
    drawGameOver();
  }
}

// Bryggen Blocks — Touch Input & Game Loop

let lastDrop = 0;
let animationId = null;
let dropZone = null;

function positionDropZone() {
  if (!dropZone || !cellSize) return;
  const boardBottom = boardOffsetY + cellSize * ROWS;
  const dropH = cellSize * 3;
  dropZone.style.left   = boardOffsetX + 'px';
  dropZone.style.top    = (boardBottom - dropH) + 'px';
  dropZone.style.width  = (cellSize * COLS) + 'px';
  dropZone.style.height = dropH + 'px';
}

function setupInput() {
  dropZone = document.getElementById('drop-zone');

  document.getElementById('btn-left').addEventListener('pointerdown', function(e) {
    e.preventDefault(); e.stopPropagation(); movePiece(0, -1);
  });
  document.getElementById('btn-right').addEventListener('pointerdown', function(e) {
    e.preventDefault(); e.stopPropagation(); movePiece(0, 1);
  });
  document.getElementById('btn-rotate-ccw').addEventListener('pointerdown', function(e) {
    e.preventDefault(); e.stopPropagation(); rotatePiece(-1);
  });
  document.getElementById('btn-rotate-cw').addEventListener('pointerdown', function(e) {
    e.preventDefault(); e.stopPropagation(); rotatePiece(1);
  });

  // Drop zone: tap bottom 3 rows to hard drop
  dropZone.addEventListener('pointerdown', function(e) {
    e.preventDefault();
    if (gameOver) {
      startGame();
      lastDrop = performance.now();
      return;
    }
    if (running && currentPiece) {
      hardDrop();
      lastDrop = performance.now();
    }
  });

  // Tap canvas to restart when game over
  canvas.addEventListener('pointerdown', function(e) {
    if (gameOver) {
      startGame();
      lastDrop = performance.now();
    }
  });

  // Prevent unwanted touch behaviors
  document.addEventListener('touchmove', function(e) { e.preventDefault(); }, { passive: false });
  document.addEventListener('gesturestart', function(e) { e.preventDefault(); });
  document.addEventListener('gesturechange', function(e) { e.preventDefault(); });
  document.addEventListener('gestureend', function(e) { e.preventDefault(); });

  positionDropZone();
}

// ---- Override resizeCanvas to also reposition drop zone ----
var _origResizeCanvas = resizeCanvas;
resizeCanvas = function() {
  _origResizeCanvas();
  positionDropZone();
};

// ---- Game Loop ----

function gameLoop(timestamp) {
  if (!running || gameOver) {
    render();
    animationId = requestAnimationFrame(gameLoop);
    return;
  }

  if (timestamp - lastDrop > getDropInterval()) {
    tick();
    lastDrop = timestamp;
  }

  render();
  animationId = requestAnimationFrame(gameLoop);
}

function initGame() {
  initCanvas();
  setupInput();
  startGame();
  lastDrop = performance.now();
  animationId = requestAnimationFrame(gameLoop);
}

document.addEventListener('DOMContentLoaded', initGame);

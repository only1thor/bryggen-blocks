// Bryggen Blocks — Touch Input & Game Loop

let lastDrop = 0;
let animationId = null;

function setupInput() {
  const btnLeft   = document.getElementById('btn-left');
  const btnRight  = document.getElementById('btn-right');
  const btnRotCCW = document.getElementById('btn-rotate-ccw');
  const btnRotCW  = document.getElementById('btn-rotate-cw');

  btnLeft.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    movePiece(0, -1);
  });

  btnRight.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    movePiece(0, 1);
  });

  btnRotCCW.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    rotatePiece(-1);
  });

  btnRotCW.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    rotatePiece(1);
  });

  // Tap bottom 2 rows of board = hard drop (invisible interaction zone)
  canvas.addEventListener('pointerdown', (e) => {
    if (gameOver) {
      startGame();
      lastDrop = performance.now();
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;

    // Check if tap is within bottom 2 rows of the board
    const boardBottom = boardOffsetY + cellSize * ROWS;
    const dropZoneTop = boardBottom - cellSize * 2;

    if (cx >= boardOffsetX && cx <= boardOffsetX + cellSize * COLS &&
        cy >= dropZoneTop && cy <= boardBottom) {
      hardDrop();
      lastDrop = performance.now();
    }
  });

  // Prevent unwanted touch behaviors
  document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('gesturechange', (e) => e.preventDefault());
  document.addEventListener('gestureend', (e) => e.preventDefault());
}

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

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', initGame);

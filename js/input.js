// Bryggen Blocks — Touch Input & Game Loop

let lastDrop = 0;
let animationId = null;

function setupInput() {
  const btnRotCCW = document.getElementById('btn-rotate-ccw');
  const btnRotCW  = document.getElementById('btn-rotate-cw');
  const btnDrop   = document.getElementById('btn-drop');

  btnRotCCW.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    rotatePiece(-1);
  });

  btnRotCW.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    rotatePiece(1);
  });

  btnDrop.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    hardDrop();
    lastDrop = performance.now();
  });

  // Tap canvas to restart after game over
  canvas.addEventListener('pointerdown', () => {
    if (gameOver) {
      startGame();
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

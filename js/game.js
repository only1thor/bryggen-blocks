// Bryggen Blocks — Core Game Logic

// ---- Game State ----
let board = [];
let currentPiece = null;   // { type, rotation, row, col }
let nextPieceType = null;
let score = 0;
let lines = 0;
let running = false;
let gameOver = false;

// ---- Board ----

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function isInBounds(row, col) {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS;
}

function cellOccupied(row, col) {
  if (!isInBounds(row, col)) return true;  // walls count as occupied
  return board[row][col] !== null;
}

// ---- Pieces ----

function getShape(type, rotation) {
  return SHAPES[type][rotation];
}

function getColor(type) {
  return PIECE_COLORS[type];
}

function randomPieceType() {
  return PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
}

function spawnPiece(type) {
  const shape = getShape(type, 0);
  const col = Math.floor((COLS - shape[0].length) / 2);
  const row = 0;
  return { type, rotation: 0, row, col };
}

// ---- Collision Detection ----

function collides(type, rotation, row, col) {
  const shape = getShape(type, rotation);
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const boardRow = row + r;
        const boardCol = col + c;
        if (boardRow >= ROWS || boardCol < 0 || boardCol >= COLS || boardRow < 0) {
          return true;
        }
        if (boardRow >= 0 && board[boardRow][boardCol] !== null) {
          return true;
        }
      }
    }
  }
  return false;
}

// ---- Movement ----

function movePiece(dRow, dCol) {
  if (!currentPiece || gameOver) return false;
  const newRow = currentPiece.row + dRow;
  const newCol = currentPiece.col + dCol;
  if (!collides(currentPiece.type, currentPiece.rotation, newRow, newCol)) {
    currentPiece.row = newRow;
    currentPiece.col = newCol;
    return true;
  }
  return false;
}

// ---- Rotation (SRS with wall kicks) ----

function rotatePiece(direction) {
  if (!currentPiece || gameOver) return false;
  // direction: 1 = CW, -1 = CCW
  const oldRot = currentPiece.rotation;
  const newRot = (oldRot + direction + 4) % 4;
  const kicks = currentPiece.type === 'I' ? WALL_KICKS.I : WALL_KICKS.normal;
  // For CW (0→1, 1→2, etc.), use kicks[oldRot]
  // For CCW (0→3, 3→2, etc.), the kick table for the reverse direction
  // is kicks[newRot] with negated offsets
  let kickList;
  if (direction === 1) {
    kickList = kicks[oldRot];
  } else {
    // CCW: use kicks[newRot] (which maps newRot→oldRot) with negated offsets
    kickList = kicks[newRot].map(([dc, dr]) => [-dc, -dr]);
  }

  for (const [dc, dr] of kickList) {
    const testRow = currentPiece.row + dr;
    const testCol = currentPiece.col + dc;
    if (!collides(currentPiece.type, newRot, testRow, testCol)) {
      currentPiece.rotation = newRot;
      currentPiece.row = testRow;
      currentPiece.col = testCol;
      return true;
    }
  }
  return false;
}

// ---- Hard Drop ----

function hardDrop() {
  if (!currentPiece || gameOver) return;
  while (movePiece(1, 0)) {
    // keep dropping
  }
  lockPiece();
}

function ghostRow() {
  if (!currentPiece) return -1;
  let row = currentPiece.row;
  while (!collides(currentPiece.type, currentPiece.rotation, row + 1, currentPiece.col)) {
    row++;
  }
  return row;
}

// ---- Locking & Line Clearing ----

function lockPiece() {
  if (!currentPiece) return;
  const shape = getShape(currentPiece.type, currentPiece.rotation);
  const color = getColor(currentPiece.type);
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const boardRow = currentPiece.row + r;
        const boardCol = currentPiece.col + c;
        if (boardRow >= 0 && boardRow < ROWS && boardCol >= 0 && boardCol < COLS) {
          board[boardRow][boardCol] = color;
        }
      }
    }
  }
  currentPiece = null;
}

function clearLines() {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(cell => cell !== null)) {
      board.splice(r, 1);
      board.unshift(Array(COLS).fill(null));
      cleared++;
      r++; // re-check this row since rows shifted down
    }
  }
  return cleared;
}

// ---- Game Flow ----

function nextPiece() {
  if (nextPieceType === null) {
    nextPieceType = randomPieceType();
  }
  const type = nextPieceType;
  nextPieceType = randomPieceType();
  return spawnPiece(type);
}

function startGame() {
  board = createBoard();
  score = 0;
  lines = 0;
  gameOver = false;
  running = true;
  nextPieceType = null;
  currentPiece = nextPiece();
  if (collides(currentPiece.type, currentPiece.rotation, currentPiece.row, currentPiece.col)) {
    running = false;
    gameOver = true;
  }
}

function tick() {
  if (!running || gameOver) return;
  if (!currentPiece) return;

  if (!movePiece(1, 0)) {
    lockPiece();
    const cleared = clearLines();
    if (cleared > 0) {
      score += SCORE_TABLE[Math.min(cleared, 4)];
      lines += cleared;
    }
    currentPiece = nextPiece();
    if (collides(currentPiece.type, currentPiece.rotation, currentPiece.row, currentPiece.col)) {
      running = false;
      gameOver = true;
    }
  }
}

function getDropInterval() {
  return DROP_INTERVAL; // fixed speed
}

// ---- Tests (run in browser console: Game.runTests()) ----
function runTests() {
  let passed = 0;
  let failed = 0;
  const assert = (cond, msg) => {
    if (cond) { passed++; }
    else { console.error('FAIL:', msg); failed++; }
  };

  // Reset
  board = createBoard();
  currentPiece = null;
  gameOver = false;

  // spawnPiece
  const piece = spawnPiece('T');
  assert(piece.type === 'T', 'spawnPiece type');
  assert(piece.rotation === 0, 'spawnPiece rotation');
  assert(piece.row === 0, 'spawnPiece row');

  // collides at spawn
  assert(!collides('T', 0, 0, 3), 'T piece fits at spawn');

  // collides with wall
  assert(collides('T', 0, 0, -1), 'T hits left wall');
  assert(collides('T', 0, 0, 8), 'T hits right wall');
  assert(!collides('I', 0, 0, 3), 'I piece fits at spawn col 3');

  // movePiece
  currentPiece = spawnPiece('T');
  assert(movePiece(0, 1) === true, 'move right OK');
  assert(currentPiece.col === 4, 'moved right to col 4');
  assert(movePiece(0, -1) === true, 'move left OK');
  assert(currentPiece.col === 3, 'moved left back to col 3');

  // move into wall
  currentPiece.col = 0;
  assert(movePiece(0, -1) === false, 'blocked by left wall');
  assert(currentPiece.col === 0, 'col unchanged after wall block');

  // hardDrop
  currentPiece = spawnPiece('O');
  hardDrop();
  // O piece is 2x2, spawns at col 4, so should land at row 18
  assert(board[18][4] === PIECE_COLORS.O, 'O landed at row 18 col 4');
  assert(board[18][5] === PIECE_COLORS.O, 'O landed at row 18 col 5');
  assert(board[19][4] === PIECE_COLORS.O, 'O landed at row 19 col 4');
  assert(board[19][5] === PIECE_COLORS.O, 'O landed at row 19 col 5');

  // clearLines
  // Fill row 19 (bottom) completely
  board = createBoard();
  for (let c = 0; c < COLS; c++) board[19][c] = COLORS.red;
  const cleared = clearLines();
  assert(cleared === 1, 'one line cleared');
  assert(board[19].every(c => c === null), 'bottom row is now empty');
  assert(board[18].every(c => c === null), 'row above is empty too');

  // Rotation
  board = createBoard();
  currentPiece = spawnPiece('T');
  const origRot = currentPiece.rotation;
  assert(rotatePiece(1) === true, 'rotate CW succeeds in open space');
  assert(currentPiece.rotation === (origRot + 1) % 4, 'rotation incremented');

  // rotate CCW
  assert(rotatePiece(-1) === true, 'rotate CCW succeeds');
  assert(currentPiece.rotation === origRot, 'rotation back to original');

  // Game over detection
  board = createBoard();
  // Fill top rows
  for (let c = 0; c < COLS; c++) board[0][c] = COLORS.red;
  currentPiece = spawnPiece('T');
  assert(collides(currentPiece.type, currentPiece.rotation, currentPiece.row, currentPiece.col),
    'game over when spawn blocked');

  console.log(`Tests: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// Export for test access
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createBoard, collides, spawnPiece, movePiece, rotatePiece, hardDrop, lockPiece, clearLines, startGame, tick, runTests, board, currentPiece, score, running, gameOver };
}

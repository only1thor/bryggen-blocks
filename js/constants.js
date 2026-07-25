// Bryggen Blocks — Game Constants

// Board dimensions
const COLS = 10;
const ROWS = 20;

// Bryggen block colors
const COLORS = {
  ochre:   '#C4943A',
  white:   '#F5F0E8',
  red:     '#BA3B2E',
  darkred: '#7A2A1C',
  yellow:  '#E8C547',
};

// Background building colors (muted for atmosphere)
const BG_BUILDINGS = [
  { color: '#9B3028', height: 0.85 },
  { color: '#E8E0D0', height: 0.70 },
  { color: '#A07828', height: 0.95 },
  { color: '#D4B038', height: 0.60 },
  { color: '#6B2218', height: 0.80 },
  { color: '#9B3028', height: 0.75 },
  { color: '#E8E0D0', height: 0.90 },
];

const BG_SKY    = '#C5D5E0';
const BG_WATER  = '#4A6B8A';
const BG_ROOF   = '#5A4030';

// Assign block colors to piece types
const PIECE_COLORS = {
  I: COLORS.yellow,
  O: COLORS.white,
  T: COLORS.ochre,
  S: COLORS.red,
  Z: COLORS.darkred,
  J: COLORS.ochre,
  L: COLORS.red,
};

// Tetromino shapes (4 rotation states each, 0=spawn)
const SHAPES = {
  I: [
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
    [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
    [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
  ],
  O: [
    [[1,1],[1,1]],
    [[1,1],[1,1]],
    [[1,1],[1,1]],
    [[1,1],[1,1]],
  ],
  T: [
    [[0,1,0],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,1],[0,1,0]],
    [[0,0,0],[1,1,1],[0,1,0]],
    [[0,1,0],[1,1,0],[0,1,0]],
  ],
  S: [
    [[0,1,1],[1,1,0],[0,0,0]],
    [[0,1,0],[0,1,1],[0,0,1]],
    [[0,0,0],[0,1,1],[1,1,0]],
    [[1,0,0],[1,1,0],[0,1,0]],
  ],
  Z: [
    [[1,1,0],[0,1,1],[0,0,0]],
    [[0,0,1],[0,1,1],[0,1,0]],
    [[0,0,0],[1,1,0],[0,1,1]],
    [[0,1,0],[1,1,0],[1,0,0]],
  ],
  J: [
    [[1,0,0],[1,1,1],[0,0,0]],
    [[0,1,1],[0,1,0],[0,1,0]],
    [[0,0,0],[1,1,1],[0,0,1]],
    [[0,1,0],[0,1,0],[1,1,0]],
  ],
  L: [
    [[0,0,1],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,0],[0,1,1]],
    [[0,0,0],[1,1,1],[1,0,0]],
    [[1,1,0],[0,1,0],[0,1,0]],
  ],
};

const PIECE_TYPES = ['I','O','T','S','Z','J','L'];

// SRS wall kick data for rotation
// [fromState][toState] = list of [colOffset, rowOffset] to try
// Positive row = down, positive col = right
const WALL_KICKS = {
  normal: [
    [[ 0, 0], [-1, 0], [-1,-1], [ 0, 2], [-1, 2]], // 0→1
    [[ 0, 0], [ 1, 0], [ 1, 1], [ 0,-2], [ 1,-2]], // 1→2
    [[ 0, 0], [ 1, 0], [ 1,-1], [ 0, 2], [ 1, 2]], // 2→3
    [[ 0, 0], [-1, 0], [-1, 1], [ 0,-2], [-1,-2]], // 3→0
  ],
  I: [
    [[ 0, 0], [-2, 0], [ 1, 0], [-2, 1], [ 1,-2]], // 0→1
    [[ 0, 0], [-1, 0], [ 2, 0], [-1,-2], [ 2, 1]], // 1→2
    [[ 0, 0], [ 2, 0], [-1, 0], [ 2,-1], [-1, 2]], // 2→3
    [[ 0, 0], [ 1, 0], [-2, 0], [ 1, 2], [-2,-1]], // 3→0
  ],
};

// Timing (ms)
const DROP_INTERVAL = 800;

// Scoring: index = lines cleared
const SCORE_TABLE = [0, 100, 300, 500, 800];

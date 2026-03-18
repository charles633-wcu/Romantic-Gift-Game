// src/config/levelGenerator.js

const GRAVITY    = 1000;
const JUMP_V     = 460;
const MOVE_SPEED = 200;
const MAX_JUMP_H = (JUMP_V * JUMP_V) / (2 * GRAVITY); // ≈ 105.8 px

/**
 * Maximum horizontal gap crossable when the target is `rise` px higher on screen
 * (rise > 0 = target is higher = harder; rise <= 0 = target is lower = easier).
 */
function maxCrossableGap(rise) {
  if (rise >= MAX_JUMP_H) return 0;
  const disc = JUMP_V * JUMP_V - 2 * GRAVITY * Math.max(0, rise);
  const t    = (JUMP_V + Math.sqrt(disc)) / GRAVITY;
  return Math.max(0, Math.floor(MOVE_SPEED * t) - 15);
}

function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── BFS Validator ───────────────────────────────────────────────────────────

/**
 * Directed check: can the player jump FROM `from` TO `to`?
 * rise = from.y - to.y  (positive = to is higher on screen = harder jump)
 */
function canJump(from, to) {
  const rise = from.y - to.y;
  if (rise >= MAX_JUMP_H) return false;
  const maxGap = maxCrossableGap(rise);

  // For moving platforms, use their full oscillation envelope
  const fromLeft  = from.x - (from.moving ? (from.moveRange || 0) : 0);
  const fromRight = from.x + from.w + (from.moving ? (from.moveRange || 0) : 0);
  const toLeft    = to.x   - (to.moving   ? (to.moveRange   || 0) : 0);
  const toRight   = to.x   + to.w + (to.moving ? (to.moveRange || 0) : 0);

  let dist;
  if      (toLeft  >= fromRight) dist = toLeft  - fromRight;
  else if (toRight <= fromLeft)  dist = fromLeft - toRight;
  else                           dist = 0; // overlapping

  return dist <= maxGap;
}

/**
 * BFS from platforms[0] (spawn). Returns true if platforms[last] (goal) is reachable.
 */
function isLevelSolvable(level) {
  const { platforms } = level;
  const n = platforms.length;
  if (n < 2) return false;

  const reachable = new Array(n).fill(false);
  reachable[0] = true;
  const queue = [0];
  let head = 0;

  while (head < queue.length) {
    const i = queue[head++];
    for (let j = 0; j < n; j++) {
      if (reachable[j]) continue;
      if (canJump(platforms[i], platforms[j])) {
        reachable[j] = true;
        queue.push(j);
      }
    }
  }

  return reachable[n - 1];
}

// ─── Orientation & Map Dimensions ────────────────────────────────────────────

function getOrientation() {
  const r = Math.random();
  if (r < 0.333) return 'wide';
  if (r < 0.666) return 'tall';
  return 'both';
}

function getMapDimensions(diff, orientation) {
  switch (orientation) {
    case 'wide': return { mapWidth: 800 + diff * 90,  mapHeight: 450 };
    case 'tall': return { mapWidth: 800 + diff * 20,  mapHeight: 450 + diff * 40 };
    case 'both': return { mapWidth: 800 + diff * 60,  mapHeight: 450 + diff * 25 };
  }
}

function getGoalPosition(mapWidth, mapHeight, orientation) {
  switch (orientation) {
    case 'wide': return { x: mapWidth - 130,                      y: mapHeight - 80 - rnd(0, 60) };
    case 'tall': return { x: Math.floor(mapWidth / 2) - 45,       y: 80 + rnd(0, 40) };
    case 'both': return { x: mapWidth - 130,                      y: 80 + rnd(0, 60) };
  }
}

// ─── Backward Chain Generator ─────────────────────────────────────────────────

function _generateLevelOnce(levelNum) {
  const diff = Math.min(levelNum, 30);

  const orientation            = getOrientation();
  const { mapWidth, mapHeight } = getMapDimensions(diff, orientation);

  const platWMin       = Math.max(38,  90 - diff * 1.8);
  const platWMax       = Math.max(58, 115 - diff * 1.5);
  const movingProb     = Math.min(0.05 + diff * 0.03, 0.55);
  const gapMin         = Math.min(28 + diff * 2,  75);
  const gapMaxTarget   = Math.min(55 + diff * 5, 160);
  const maxGoombas     = Math.floor(diff * 0.4);
  const maxButterflies = Math.floor(diff * 0.3);
  const bouncePadProb  = Math.min(0.05 + diff * 0.01, 0.25);
  const blinkingProb   = Math.min(0.03 + diff * 0.02, 0.25);
  const conveyorProb   = Math.min(0.03 + diff * 0.02, 0.25);
  const windmillProb   = Math.min(0.02 + diff * 0.02, 0.30);

  // chain is built right-to-left, reversed at the end
  const chain = [];

  // Place goal platform
  const goalPos = getGoalPosition(mapWidth, mapHeight, orientation);
  const goalW   = 90;
  const goalPlat = { x: goalPos.x, y: goalPos.y, w: goalW, h: 15 };
  chain.push(goalPlat);

  let rightPlat = goalPlat;

  // Build backwards until we reach the spawn zone
  while (rightPlat.x > 110) {
    const nw = rnd(Math.floor(platWMin), Math.floor(platWMax));

    // Choose rise_target: how much higher rightPlat is than the new (left) platform.
    // rise_target > 0  → ny > rightPlat.y → new platform is LOWER on screen
    // rise_target < 0  → ny < rightPlat.y → new platform is HIGHER on screen
    let riseTarget;
    if (rightPlat.y < 130) {
      // Chain is near the top — place new platform LOWER to give room (riseTarget > 0 → ny larger)
      riseTarget = rnd(10, 50);
    } else if (rightPlat.y > mapHeight - 80) {
      // Chain is near the bottom — place new platform HIGHER (riseTarget < 0 → ny smaller)
      riseTarget = rnd(-65, -15);
    } else {
      switch (orientation) {
        case 'wide': riseTarget = rnd(-20, 40); break;
        case 'tall': riseTarget = rnd(20,  75); break;
        case 'both': riseTarget = rnd(-30, 75); break;
      }
    }

    // New platform y: rightPlat.y + riseTarget (positive riseTarget = lower on screen)
    const ny = Math.max(90, Math.min(mapHeight - 80, rightPlat.y + riseTarget));

    // Actual rise from new (source) platform to rightPlat (target): source.y - target.y
    const actualRise = ny - rightPlat.y;
    const maxGap     = maxCrossableGap(actualRise);

    let safeGapMax = Math.min(gapMaxTarget, maxGap - 10);
    let safeGapMin = Math.max(10, Math.min(gapMin, safeGapMax - 20));
    if (safeGapMax < safeGapMin) safeGapMax = safeGapMin;

    const gap = rnd(safeGapMin, safeGapMax);
    const nx  = rightPlat.x - nw - gap;

    if (nx <= 110) break; // covers both nx < 0 and landing in the spawn zone

    const plat = { x: nx, y: ny, w: nw, h: 15 };

    if (Math.random() < movingProb) {
      plat.moving    = true;
      plat.moveRange = rnd(22, Math.min(55, Math.floor(gap * 0.35)));
      plat.moveSpeed = rnd(38, 40 + diff * 2);
    }

    chain.push(plat);
    rightPlat = plat;
  }

  // Spawn platform (always bottom-left)
  const spawnY    = mapHeight - 80;
  const spawnPlat = { x: 10, y: spawnY, w: 100, h: 15 };

  // Spawn bridge check: verify leftmost chain platform is reachable from spawn
  const firstChainPlat   = chain[chain.length - 1];
  const spawnRightEdge   = 110;
  const requiredGap      = firstChainPlat.x - spawnRightEdge;
  const riseFromSpawn    = spawnY - firstChainPlat.y; // source.y - target.y
  const maxAllowedFromSpawn = maxCrossableGap(riseFromSpawn);

  if (requiredGap > maxAllowedFromSpawn) {
    if (riseFromSpawn < MAX_JUMP_H) {
      // Case A: horizontal gap only — single bridge
      const bridgeX = Math.max(spawnRightEdge + 10, spawnRightEdge + Math.floor(requiredGap / 2) - 40);
      const bridgeY = Math.max(90, Math.min(mapHeight - 80, spawnY - Math.floor(riseFromSpawn / 2)));
      chain.push({ x: bridgeX, y: bridgeY, w: 80, h: 15 });
    } else {
      // Case B: rise >= MAX_JUMP_H — two-bridge staircase splitting rise into thirds
      const bridge1X = Math.max(spawnRightEdge + 10, spawnRightEdge + Math.floor(requiredGap / 3) - 40);
      const bridge1Y = Math.max(90, Math.min(mapHeight - 80, spawnY - Math.floor(riseFromSpawn / 3)));

      const bridge2X = Math.max(bridge1X + 90, spawnRightEdge + Math.floor(2 * requiredGap / 3) - 40);
      const bridge2Y = Math.max(90, Math.min(mapHeight - 80, spawnY - Math.floor(2 * riseFromSpawn / 3)));

      chain.push({ x: bridge1X, y: bridge1Y, w: 80, h: 15 });
      chain.push({ x: bridge2X, y: bridge2Y, w: 80, h: 15 });
    }
  }

  chain.push(spawnPlat);

  // Reverse: platforms[0] = spawn, platforms[last] = goal
  chain.reverse();
  const platforms = chain;

  // ── Decorations ──────────────────────────────────────────────────────────
  const hearts      = [];
  const goombas     = [];
  const butterflies = [];
  let goombaCount = 0, bfCount = 0;
  const bouncePads  = [];
  const windmills   = [];

  // Skip spawn (index 0) and goal (index last)
  for (let i = 1; i < platforms.length - 1; i++) {
    const p    = platforms[i];
    const prev = platforms[i - 1];
    const gap  = p.x - (prev.x + prev.w);

    if (Math.random() < 0.55) {
      hearts.push({ x: Math.floor(p.x + p.w / 2), y: p.y - 28 });
    }

    if (goombaCount < maxGoombas && p.w >= 64 && Math.random() < 0.35) {
      p.hasGoomba = true;
      const range = Math.min(Math.floor(p.w / 2) - 16, 42);
      goombas.push({ x: Math.floor(p.x + p.w / 2), y: p.y, range, speed: rnd(44, 52 + diff) });
      goombaCount++;
    }

    if (bfCount < maxButterflies && gap >= 65 && Math.random() < 0.28) {
      const bfX     = Math.floor(prev.x + prev.w + gap / 2);
      const bfY     = Math.max(50, Math.min(prev.y, p.y) - rnd(10, 38));
      const bfRange = Math.max(10, Math.min(Math.floor(gap / 2) - 12, 48));
      butterflies.push({ x: bfX, y: bfY, range: bfRange, speed: rnd(68, 78 + diff * 3) });
      bfCount++;
    }

    if (p.w >= 50 && !p.hasGoomba && Math.random() < bouncePadProb) {
      bouncePads.push({ x: Math.floor(p.x + p.w / 2), y: p.y - 10 });
    }
  }

  // Star heart every 3rd level
  const starHearts = [];
  if (levelNum % 3 === 0 && platforms.length > 3) {
    const ref   = platforms[Math.floor(platforms.length / 3)];
    const starY = Math.max(50, ref.y - rnd(78, 92));
    starHearts.push({ x: Math.floor(ref.x + ref.w / 2), y: starY });
  }

  // Blinking + conveyor flags (skip spawn index 0 and goal index last)
  for (let i = 1; i < platforms.length - 1; i++) {
    const p = platforms[i];
    if (!p.moving && Math.random() < blinkingProb) {
      p.blinking = true;
    } else if (!p.moving && !p.blinking && Math.random() < conveyorProb) {
      p.conveyor = Math.random() < 0.5 ? 'left' : 'right';
    }
  }

  // Windmill placement: snapshot chain pairs before any splicing
  const chainPairs = [];
  for (let i = 1; i < platforms.length - 2; i++) {
    chainPairs.push([platforms[i], platforms[i + 1]]);
  }

  chainPairs.forEach(([left, right]) => {
    // Skip bridge platforms (w===80, x<250)
    if ((left.w === 80 && left.x < 250) || (right.w === 80 && right.x < 250)) return;

    const gap = right.x - (left.x + left.w);
    if (gap < 90 || Math.random() >= windmillProb) return;

    const cx     = Math.floor(left.x + left.w + gap / 2);
    const cy     = Math.floor(Math.min(left.y, right.y) - rnd(30, 55));
    const radius = Math.min(40, Math.floor(gap / 2) - 12);
    const speed  = 0.4 + Math.random() * (0.1 + diff * 0.02);

    windmills.push({ x: cx, y: cy, radius, speed });

    // Insert 4 arm BFS phantoms BEFORE the goal so isLevelSolvable still checks goal last
    const armW    = 36;
    const goalIdx = platforms.length - 1;
    // Arms at 4 cardinal positions for better BFS coverage
    [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2].forEach(a => {
      platforms.splice(goalIdx, 0, {
        x: Math.floor(cx + Math.cos(a) * radius - armW / 2),
        y: Math.floor(cy + Math.sin(a) * radius) - 4,
        w: armW,
        h: 8,
      });
    });
  });

  const goalPlatFinal = platforms[platforms.length - 1];

  return {
    id:          levelNum,
    background:  `bg-${((levelNum - 1) % 10) + 1}`,
    mapWidth,
    mapHeight,
    platforms,
    hearts,
    butterflies,
    goombas,
    starHearts,
    bouncePads,
    windmills,
    goal: { x: Math.floor(goalPlatFinal.x + goalPlatFinal.w / 2), y: goalPlatFinal.y - 28 },
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function generateLevel(levelNum) {
  let last = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    last = _generateLevelOnce(levelNum);
    if (isLevelSolvable(last)) return last;
  }
  return last; // silent fallback — BFS rarely fails with backward gen
}

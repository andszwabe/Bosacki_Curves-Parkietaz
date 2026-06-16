// Geometric Engine for Piotr Bosacki's Curves (Parkietaż)

interface Module {
  size: number;
  direction: 'L' | 'P';
}

interface TurtleState {
  x: number;
  y: number;
  angle: number;
}

interface ArcSegment {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  radius: number;
  sweep: 0 | 1;
  largeArc: 0;
  direction: 'L' | 'P';
  size: number;
  cx: number;
  cy: number;
  startAngle: number;
}

const PHI = (1 + Math.sqrt(5)) / 2; // Golden Ratio

/**
 * Parses the notation string (e.g. "1p2p3p4p5l6l7l6l5p...") into structured modules.
 */
function parseNotation(notation: string): Module[] {
  const modules: Module[] = [];
  const regex = /(\d+)([lLpP])/g;
  let match;

  while ((match = regex.exec(notation)) !== null) {
    const size = parseInt(match[1], 10);
    const direction = match[2].toUpperCase() as 'L' | 'P';
    modules.push({ size, direction });
  }

  return modules;
}

/**
 * Generates a sequence of quarter-circle arc segments from modules using turtle graphics math.
 * Invariant: 1p1p1p1p produces a perfect circle closing back to start.
 */
function generateArcs(modules: Module[]): ArcSegment[] {
  // Start turtle at (0, 0) facing UP (Math.PI / 2) to align with reference SVG chirality
  let state: TurtleState = { x: 0, y: 0, angle: Math.PI / 2 };
  const arcs: ArcSegment[] = [];

  for (const mod of modules) {
    if (mod.size < 1) {
      throw new Error(`Rozmiar modułu (${mod.size}) musi wynosić co najmniej 1.`);
    }
    if (mod.size > 32) {
      throw new Error(`Rozmiar modułu (${mod.size}) przekracza limit 32 (wielkość rośnie wykładniczo).`);
    }
    const radius = Math.pow(PHI, mod.size);
    const turnRight = mod.direction === 'P';
    const s = turnRight ? 1 : -1;

    // The center of curvature is perpendicular to the current heading
    const cx = state.x + radius * Math.cos(state.angle - s * Math.PI / 2);
    const cy = state.y + radius * Math.sin(state.angle - s * Math.PI / 2);

    // Endpoint of the 90° arc
    const endX = cx + radius * Math.cos(state.angle);
    const endY = cy + radius * Math.sin(state.angle);

    // Update heading angle by 90°
    const newAngle = state.angle - s * Math.PI / 2;

    arcs.push({
      startX: state.x,
      startY: state.y,
      endX,
      endY,
      radius,
      sweep: turnRight ? 1 : 0,
      largeArc: 0,
      direction: mod.direction,
      size: mod.size,
      cx,
      cy,
      startAngle: state.angle
    });

    state = { x: endX, y: endY, angle: newAngle };
  }

  return arcs;
}

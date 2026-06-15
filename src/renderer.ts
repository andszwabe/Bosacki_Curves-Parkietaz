// SVG Renderer and UI Controller for Piotr Bosacki's Curves (Parkietaż)

/**
 * Builds the SVG path 'd' attribute string from a list of ArcSegments.
 * Maps standard Cartesian coordinates (Y-up) to SVG space (Y-down) by negating Y.
 */
function renderSVGPath(arcs: ArcSegment[]): string {
  if (arcs.length === 0) return '';
  
  // Start at negated startY of first arc to adjust for SVG Y-down coordinate space
  let d = `M ${arcs[0].startX.toFixed(4)} ${(-arcs[0].startY).toFixed(4)}`;
  
  for (const arc of arcs) {
    d += ` A ${arc.radius.toFixed(4)} ${arc.radius.toFixed(4)} 0 0 ${arc.sweep} ${arc.endX.toFixed(4)} ${(-arc.endY).toFixed(4)}`;
  }
  
  return d;
}

/**
 * Computes the exact bounding box of the curve in SVG coordinate space.
 */
function computeBoundingBox(arcs: ArcSegment[]): { minX: number; maxX: number; minY: number; maxY: number } {
  if (arcs.length === 0) {
    return { minX: 0, maxX: 100, minY: 0, maxY: 100 };
  }
  
  let minX = arcs[0].startX;
  let maxX = arcs[0].startX;
  let minY = -arcs[0].startY;
  let maxY = -arcs[0].startY;

  for (const arc of arcs) {
    const svgEndX = arc.endX;
    const svgEndY = -arc.endY;

    minX = Math.min(minX, svgEndX);
    maxX = Math.max(maxX, svgEndX);
    minY = Math.min(minY, svgEndY);
    maxY = Math.max(maxY, svgEndY);
  }

  return { minX, maxX, minY, maxY };
}

/**
 * Creates and configures the SVG element with dynamic viewBox and path elements.
 */
function generateSVGElement(arcs: ArcSegment[]): SVGSVGElement {
  const { minX, maxX, minY, maxY } = computeBoundingBox(arcs);
  const width = maxX - minX;
  const height = maxY - minY;
  
  // Add a 5% margin padding around the bounding box
  const padding = Math.max(width, height) * 0.05 || 10;
  const viewBoxX = minX - padding;
  const viewBoxY = minY - padding;
  const viewBoxWidth = width + 2 * padding;
  const viewBoxHeight = height + 2 * padding;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `${viewBoxX.toFixed(4)} ${viewBoxY.toFixed(4)} ${viewBoxWidth.toFixed(4)} ${viewBoxHeight.toFixed(4)}`);
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("id", "curve-svg");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", renderSVGPath(arcs));
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor"); // CSS controls color in UI
  path.setAttribute("stroke-width", (Math.max(viewBoxWidth, viewBoxHeight) * 0.003).toFixed(4));
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("id", "curve-path");

  svg.appendChild(path);
  return svg;
}

/**
 * Triggers a download of the SVG curve.
 * Scales the coordinates to a standard 500-unit bounding box so that a stroke-width of 1
 * represents a crisp, thin, print-friendly line (0.2% of the drawing scale) on export.
 */
function downloadSVG(notation: string, arcs: ArcSegment[]) {
  const { minX, maxX, minY, maxY } = computeBoundingBox(arcs);
  const width = maxX - minX;
  const height = maxY - minY;
  const maxDim = Math.max(width, height);
  
  // Scale factor to normalize the maximum dimension to 500 units
  const exportScale = maxDim > 0 ? 500 / maxDim : 1;

  // Generate scaled arcs for export
  const scaledArcs = arcs.map(arc => ({
    ...arc,
    startX: arc.startX * exportScale,
    startY: arc.startY * exportScale,
    endX: arc.endX * exportScale,
    endY: arc.endY * exportScale,
    radius: arc.radius * exportScale
  }));

  const { minX: sMinX, maxX: sMaxX, minY: sMinY, maxY: sMaxY } = computeBoundingBox(scaledArcs);
  const sWidth = sMaxX - sMinX;
  const sHeight = sMaxY - sMinY;
  
  // 5% margin padding
  const padding = Math.max(sWidth, sHeight) * 0.05 || 10;
  const viewBoxX = sMinX - padding;
  const viewBoxY = sMinY - padding;
  const viewBoxWidth = sWidth + 2 * padding;
  const viewBoxHeight = sHeight + 2 * padding;

  const svgString = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg 
  xmlns="http://www.w3.org/2000/svg" 
  viewBox="${viewBoxX.toFixed(4)} ${viewBoxY.toFixed(4)} ${viewBoxWidth.toFixed(4)} ${viewBoxHeight.toFixed(4)}" 
  width="100%" 
  height="100%" 
  style="background-color: #ffffff;"
>
  <path 
    id="curve-path" 
    d="${renderSVGPath(scaledArcs)}" 
    fill="none" 
    stroke="#000000" 
    stroke-width="1" 
    stroke-linecap="round" 
    stroke-linejoin="round"
  />
</svg>`;

  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  const safeNotation = notation.trim().replace(/[^a-zA-Z0-9]/g, "_");
  link.href = url;
  link.download = `output-curve_${safeNotation}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// UI Setup & DOM Controller
function init() {
  const inputEl = document.getElementById("notation-input") as HTMLInputElement;
  const downloadEl = document.getElementById("download-btn") as HTMLButtonElement;
  const containerEl = document.getElementById("svg-container") as HTMLDivElement;
  const statsEl = document.getElementById("stats-display") as HTMLDivElement;
  const errorEl = document.getElementById("error-display") as HTMLDivElement;

  let currentArcs: ArcSegment[] = [];

  function render() {
    const notation = inputEl.value.trim();
    errorEl.textContent = "";
    errorEl.classList.add("hidden");

    if (!notation) {
      errorEl.textContent = "Wpisz notację np: 1p2p3p4p5l6l7l6l5p4p3p2p1l2l3l4l5p6p7p6p5l4l3l2l - Seria A";
      errorEl.classList.remove("hidden");
      containerEl.innerHTML = "";
      statsEl.textContent = "Łuki: 0";
      downloadEl.disabled = true;
      currentArcs = [];
      return;
    }

    const modules = parseNotation(notation);
    if (modules.length === 0) {
      errorEl.textContent = "Błąd: Nie znaleziono poprawnych modułów w notacji. Użyj formatu [rozmiar][L/P] (np. 1p2p).";
      errorEl.classList.remove("hidden");
      containerEl.innerHTML = "";
      statsEl.textContent = "Łuki: 0";
      downloadEl.disabled = true;
      currentArcs = [];
      return;
    }

    // Generate arcs and render
    try {
      const arcs = generateArcs(modules);
      const svg = generateSVGElement(arcs);

      // Replace old SVG in container
      containerEl.innerHTML = "";
      containerEl.appendChild(svg);
      currentArcs = arcs;

      // Update stats
      statsEl.textContent = `Łuki: ${arcs.length}`;

      // Only enable the download button if the notation ends with a letter (completed module)
      const endsWithLetter = /[lLpP]/.test(notation.slice(-1));
      downloadEl.disabled = !endsWithLetter;
    } catch (err: any) {
      errorEl.textContent = `Błąd generowania: ${err.message}`;
      errorEl.classList.remove("hidden");
      containerEl.innerHTML = "";
      statsEl.textContent = "Łuki: 0";
      downloadEl.disabled = true;
      currentArcs = [];
    }
  }

  // Event Listeners - render dynamically on every keystroke/input change
  inputEl.addEventListener("input", () => {
    const start = inputEl.selectionStart;
    const originalValue = inputEl.value;
    
    // Build strictly alternating pattern: digit (1-7), then letter (L, P, l, p)
    let filteredValue = "";
    for (let i = 0; i < originalValue.length; i++) {
      const char = originalValue[i];
      if (filteredValue.length % 2 === 0) {
        if (/[1-7]/.test(char)) {
          filteredValue += char;
        }
      } else {
        if (/[lLpP]/.test(char)) {
          filteredValue += char;
        }
      }
    }

    if (originalValue !== filteredValue) {
      inputEl.value = filteredValue;
      if (start !== null) {
        // Calculate the filtered position of the selection cursor
        let prefix = originalValue.substring(0, start);
        let filteredPrefix = "";
        for (let i = 0; i < prefix.length; i++) {
          const char = prefix[i];
          if (filteredPrefix.length % 2 === 0) {
            if (/[1-7]/.test(char)) filteredPrefix += char;
          } else {
            if (/[lLpP]/.test(char)) filteredPrefix += char;
          }
        }
        const cursorPosition = filteredPrefix.length;
        inputEl.setSelectionRange(cursorPosition, cursorPosition);
      }
    }
    render();
  });

  downloadEl.addEventListener("click", () => {
    if (currentArcs.length > 0) {
      downloadSVG(inputEl.value, currentArcs);
    }
  });

  // Initial load rendering
  render();
}

// Execute initialization safely depending on page load state
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

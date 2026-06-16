// SVG Renderer and UI Controller for Piotr Bosacki's Curves (Parkietaż)

interface ActiveSeries {
  id: string;
  arcs: ArcSegment[];
  color: string;
  notation: string;
}

interface ParsedLine {
  id: string;
  lineIndex: number;
  notation: string;
  modules: Module[];
  color: string;
}

// Global State
let colorMode: 'color' | 'mono' = 'color';
let focusedSeriesId: string | null = null;

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
 * Builds the SVG path 'd' attribute string for a partially completed curve.
 * Draws first 'fullSegmentsCount' segments, then animates the next segment up to fraction 't - fullSegmentsCount'.
 * Each segment takes exactly 1 second to draw (so t represents elapsed seconds).
 */
function renderPartialSVGPath(arcs: ArcSegment[], modules: Module[], t: number): string {
  if (arcs.length === 0) return '';
  if (t < 0) t = 0;
  
  const fullSegmentsCount = Math.floor(t);
  const frac = t - fullSegmentsCount;

  // Start at negated startY of first arc
  let d = `M ${arcs[0].startX.toFixed(4)} ${(-arcs[0].startY).toFixed(4)}`;

  // Draw full segments
  const limit = Math.min(arcs.length, fullSegmentsCount);
  for (let i = 0; i < limit; i++) {
    const arc = arcs[i];
    d += ` A ${arc.radius.toFixed(4)} ${arc.radius.toFixed(4)} 0 0 ${arc.sweep} ${arc.endX.toFixed(4)} ${(-arc.endY).toFixed(4)}`;
  }

  // Draw partial segment if applicable
  if (fullSegmentsCount < arcs.length && frac > 0) {
    const arc = arcs[fullSegmentsCount];
    const radius = arc.radius;
    const turnRight = arc.sweep === 1;
    const s = turnRight ? 1 : -1;

    const cx = arc.cx;
    const cy = arc.cy;
    const startAngle = arc.startAngle;

    // Compute sweep endpoint at angle theta = frac * (Math.PI / 2)
    const theta = frac * (Math.PI / 2);
    const angleArg = startAngle - s * Math.PI / 2 - s * theta;
    const partialEndX = cx - radius * Math.cos(angleArg);
    const partialEndY = cy - radius * Math.sin(angleArg);

    d += ` A ${radius.toFixed(4)} ${radius.toFixed(4)} 0 0 ${arc.sweep} ${partialEndX.toFixed(4)} ${(-partialEndY).toFixed(4)}`;
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
function generateSVGElement(seriesList: ActiveSeries[]): SVGSVGElement {
  const allArcs = seriesList.flatMap(s => s.arcs);
  const { minX, maxX, minY, maxY } = computeBoundingBox(allArcs);
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

  const strokeWidth = (Math.max(viewBoxWidth, viewBoxHeight) * 0.003).toFixed(4);

  for (const s of seriesList) {
    if (s.arcs.length === 0) continue;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", renderSVGPath(s.arcs));
    path.setAttribute("data-series-id", s.id);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", colorMode === 'color' ? s.color : "#000000");
    path.setAttribute("stroke-width", strokeWidth);
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    
    // Apply focus dimming if another series is focused
    if (focusedSeriesId !== null && s.id !== focusedSeriesId) {
      path.setAttribute("opacity", "0.03");
    }
    
    svg.appendChild(path);
  }

  return svg;
}

/**
 * Triggers a download of the SVG curve containing all active paths.
 * Scales the coordinates to a standard 500-unit bounding box so that a stroke-width of 1
 * represents a crisp, thin, print-friendly line (0.2% of the drawing scale) on export.
 */
function downloadSVG(seriesList: ActiveSeries[], filenameNotation: string) {
  const allArcs = seriesList.flatMap(s => s.arcs);
  const { minX, maxX, minY, maxY } = computeBoundingBox(allArcs);
  const width = maxX - minX;
  const height = maxY - minY;
  const maxDim = Math.max(width, height);
  
  // Scale factor to normalize the maximum dimension to 500 units
  const exportScale = maxDim > 0 ? 500 / maxDim : 1;

  // Scale and generate the SVG path elements
  const scaledSeries = seriesList.map(s => {
    const scaledArcs = s.arcs.map(arc => ({
      ...arc,
      startX: arc.startX * exportScale,
      startY: arc.startY * exportScale,
      endX: arc.endX * exportScale,
      endY: arc.endY * exportScale,
      radius: arc.radius * exportScale
    }));
    return {
      id: s.id,
      arcs: scaledArcs,
      color: s.color
    };
  });

  const allScaledArcs = scaledSeries.flatMap(s => s.arcs);
  const { minX: sMinX, maxX: sMaxX, minY: sMinY, maxY: sMaxY } = computeBoundingBox(allScaledArcs);
  const sWidth = sMaxX - sMinX;
  const sHeight = sMaxY - sMinY;
  
  const padding = Math.max(sWidth, sHeight) * 0.05 || 10;
  const viewBoxX = sMinX - padding;
  const viewBoxY = sMinY - padding;
  const viewBoxWidth = sWidth + 2 * padding;
  const viewBoxHeight = sHeight + 2 * padding;

  let pathElements = "";
  for (const s of scaledSeries) {
    if (s.arcs.length === 0) continue;
    
    const isDimmed = focusedSeriesId !== null && s.id !== focusedSeriesId;
    const opacityAttr = isDimmed ? ' opacity="0.03"' : '';
    
    pathElements += `  <path 
    d="${renderSVGPath(s.arcs)}" 
    fill="none" 
    stroke="${colorMode === 'color' ? s.color : "#000000"}" 
    stroke-width="1" 
    stroke-linecap="round" 
    stroke-linejoin="round"${opacityAttr}
  />\n`;
  }

  const svgString = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg 
  xmlns="http://www.w3.org/2000/svg" 
  viewBox="${viewBoxX.toFixed(4)} ${viewBoxY.toFixed(4)} ${viewBoxWidth.toFixed(4)} ${viewBoxHeight.toFixed(4)}" 
  width="100%" 
  height="100%" 
  style="background-color: #ffffff;"
>
${pathElements}</svg>`;

  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  const safeNotation = filenameNotation.trim().replace(/[^a-zA-Z0-9]/g, "_");
  link.href = url;
  link.download = `output-curve_${safeNotation}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates highly distinguishable colors sequentially across the HSL color wheel:
 * - The first color (index 0) is always Black.
 * - Subsequent colors cycle through: Red, Orange, Yellow, Green, Cyan, Blue, Magenta.
 * - On each full cycle of 7 colors, the lightness shifts by +10%, then -10%, then +20%, then -20%, etc., relative to 45% base lightness.
 */
function getColorForIndex(index: number): string {
  if (index === 0) {
    return "#000000"; // First series is always black
  }
  
  // The first actual colored series (index 1) starts the cycle
  const actualIndex = index - 1;
  const BASE_HUES = [0, 30, 60, 120, 180, 240, 300]; // Red, Orange, Yellow, Green, Cyan, Blue, Magenta
  const huesPerCycle = BASE_HUES.length;
  
  const cycleNumber = Math.floor(actualIndex / huesPerCycle);
  const hueIndex = actualIndex % huesPerCycle;
  
  const hue = BASE_HUES[hueIndex];
  
  // Calculate lightness shift: 0%, +10%, -10%, +20%, -20%, +30%, -30%...
  let shift = 0;
  if (cycleNumber > 0) {
    const magnitude = 10 * Math.ceil(cycleNumber / 2);
    const isOdd = (cycleNumber % 2 !== 0);
    shift = isOdd ? magnitude : -magnitude;
  }
  
  // Base lightness is 45% to keep colors rich
  const baseLightness = 45;
  const lightness = Math.min(95, Math.max(10, baseLightness + shift));
  return `hsl(${hue}, 75%, ${lightness}%)`;
}

// UI Setup & DOM Controller
function init() {
  const containerEl = document.getElementById("svg-container") as HTMLDivElement;
  const statsEl = document.getElementById("stats-display") as HTMLDivElement;
  const errorEl = document.getElementById("error-display") as HTMLDivElement;
  const downloadEl = document.getElementById("download-btn") as HTMLButtonElement;
  const textareaEl = document.getElementById("notation-textarea") as HTMLTextAreaElement;
  const backdropEl = document.getElementById("notation-backdrop") as HTMLDivElement;
  const legendContainerEl = document.getElementById("series-legend") as HTMLDivElement;

  const colorModeBtn = document.getElementById("color-mode-btn") as HTMLButtonElement;

  // Initial state with default Seria A loaded in the textarea
  textareaEl.value = "1p2p3p4p5l6l7l6l5p4p3p2p1l2l3l4l5p6p7p6p5l4l3l2l";


  let lineVisibility: { [lineIndex: number]: boolean } = {};
  let currentActiveSeries: ActiveSeries[] = [];

  let animationFrameId: number | null = null;
  let animationStartTime: number | null = null;
  let animatingPaths: { element: SVGPathElement; arcs: ArcSegment[] }[] = [];

  function stopAnimation() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    animationStartTime = null;
    animatingPaths = [];
  }

  function startAnimation() {
    stopAnimation();
    if (currentActiveSeries.length === 0) return;

    const svgEl = document.getElementById("curve-svg");
    if (!svgEl) return;

    const paths = svgEl.querySelectorAll("path");
    paths.forEach(path => {
      const seriesId = path.getAttribute("data-series-id");
      if (seriesId) {
        const series = currentActiveSeries.find(s => s.id === seriesId);
        if (series) {
          animatingPaths.push({
            element: path as SVGPathElement,
            arcs: series.arcs.map(arc => ({ ...arc }))
          });
        }
      }
    });

    if (animatingPaths.length === 0) return;

    animationStartTime = performance.now();
    animationFrameId = requestAnimationFrame(animateFrame);
  }

  function animateFrame(timestamp: number) {
    if (animationStartTime === null) return;
    const elapsedSeconds = Math.max(0, (timestamp - animationStartTime) / 1000);

    const maxSegments = animatingPaths.reduce((max, p) => Math.max(max, p.arcs.length), 0);
    if (maxSegments === 0) {
      stopAnimation();
      return;
    }

    const t = Math.min(elapsedSeconds, maxSegments);

    for (let i = 0; i < animatingPaths.length; i++) {
      const item = animatingPaths[i];
      const partialD = renderPartialSVGPath(item.arcs, [], t);
      item.element.setAttribute("d", partialD);
    }

    if (t >= maxSegments) {
      stopAnimation();
    } else {
      animationFrameId = requestAnimationFrame(animateFrame);
    }
  }

  // Synchronize backdrop size with the textarea dynamically (handling user resizing)
  if (typeof ResizeObserver !== "undefined") {
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        backdropEl.style.height = `${(entry.target as HTMLElement).offsetHeight}px`;
        backdropEl.style.width = `${(entry.target as HTMLElement).offsetWidth}px`;
      }
    });
    resizeObserver.observe(textareaEl);
  }

  // Synchronize scroll offsets
  textareaEl.addEventListener("scroll", () => {
    backdropEl.scrollTop = textareaEl.scrollTop;
    backdropEl.scrollLeft = textareaEl.scrollLeft;
  });

  function escapeHTML(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getEyeIcon(visible: boolean): string {
    if (visible) {
      return `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      `;
    } else {
      return `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
      `;
    }
  }

  function renderCurves() {
    stopAnimation();
    if (colorModeBtn) {
      const span = colorModeBtn.querySelector("span");
      if (span) {
        span.textContent = colorMode === 'color' ? 'Kolor' : 'Mono';
      }
      if (colorMode === 'mono') {
        colorModeBtn.classList.add('btn-mono');
      } else {
        colorModeBtn.classList.remove('btn-mono');
      }
    }
    errorEl.textContent = "";
    errorEl.classList.add("hidden");

    // Split the entire value by any whitespace sequence (spaces, newlines, tabs)
    const blocks = textareaEl.value.split(/\s+/);
    const parsedLines: ParsedLine[] = [];
    let validCount = 0;

    for (let i = 0; i < blocks.length; i++) {
      const blockText = blocks[i].trim();
      if (blockText.length === 0) {
        continue;
      }

      const modules = parseNotation(blockText);
      if (modules.length === 0) {
        continue;
      }

      const id = `block_${i}`;
      const color = getColorForIndex(validCount);
      validCount++;

      // Reconstruct clean notation containing only valid parsed modules in uppercase (L/P)
      const cleanNotation = modules.map(m => `${m.size}${m.direction.toUpperCase()}`).join("");

      parsedLines.push({
        id,
        lineIndex: i,
        notation: cleanNotation,
        modules,
        color
      });
    }

    // Generate highlighted HTML for the backdrop
    let hlCount = 0;
    const escapedValue = escapeHTML(textareaEl.value);
    const highlightedHTML = escapedValue.replace(/[^\s]+/g, (blockText) => {
      const modules = parseNotation(blockText);
      if (modules.length === 0) {
        return blockText; // Unhighlighted text
      }

      const color = getColorForIndex(hlCount);
      hlCount++;

      const regex = /(\d+)([lLpP])/g;
      return blockText.replace(regex, (match, sizeStr, dir) => {
        const size = parseInt(sizeStr, 10);
        const upperDir = dir.toUpperCase();

        const isInvalid = size < 1 || size > 32;
        if (isInvalid) {
          return `<span class="hl-parsed" style="font-weight: bold; text-decoration: underline wavy var(--error-color);">${size}${upperDir}</span>`;
        }

        return `<span class="hl-parsed" style="color: ${colorMode === 'color' ? color : 'var(--text-primary)'}; font-weight: bold;">${size}${upperDir}</span>`;
      });
    });

    backdropEl.innerHTML = highlightedHTML + (highlightedHTML.endsWith('\n') ? ' ' : '');

    // Auto-clean focusedSeriesId if that block is no longer present/valid
    if (focusedSeriesId !== null) {
      const stillExists = parsedLines.some(p => p.id === focusedSeriesId);
      if (!stillExists) {
        focusedSeriesId = null;
      }
    }

    if (parsedLines.length === 0) {
      errorEl.textContent = "Wklej lub wpisz notację np: 1p2p3p4p5l6l7l6l5p4p3p2p1l2l3l4l5p6p7p6p5l4l3l2l";
      errorEl.classList.remove("hidden");
      containerEl.innerHTML = "";
      statsEl.textContent = "Łuki: 0";
      downloadEl.disabled = true;
      currentActiveSeries = [];
      renderLegend([]);
      return;
    }

    const activeSeries: ActiveSeries[] = [];
    let totalArcs = 0;
    let hasError = false;

    for (const item of parsedLines) {
      if (lineVisibility[item.lineIndex] === undefined) {
        lineVisibility[item.lineIndex] = true; // Default to visible
      }

      if (!lineVisibility[item.lineIndex]) {
        continue;
      }

      try {
        const arcs = generateArcs(item.modules);
        totalArcs += arcs.length;
        activeSeries.push({
          id: item.id,
          arcs,
          color: item.color,
          notation: item.notation
        });
      } catch (err: any) {
        errorEl.textContent = `Błąd generowania w serii "${item.notation}": ${err.message}`;
        errorEl.classList.remove("hidden");
        hasError = true;
      }
    }

    if (hasError && activeSeries.length === 0) {
      containerEl.innerHTML = "";
      statsEl.textContent = "Łuki: 0";
      downloadEl.disabled = true;
      currentActiveSeries = [];
      renderLegend(parsedLines);
      return;
    }

    // Render the SVG curves
    try {
      const svg = generateSVGElement(activeSeries);
      containerEl.innerHTML = "";
      containerEl.appendChild(svg);
      currentActiveSeries = activeSeries;

      statsEl.textContent = `Łuki: ${totalArcs}`;

      // Disable download if any visible active series ends with incomplete module sizes/letters
      const allComplete = activeSeries.every(s => /[lLpP]/.test(s.notation.trim().slice(-1)));
      downloadEl.disabled = !allComplete;
    } catch (err: any) {
      errorEl.textContent = `Błąd: ${err.message}`;
      errorEl.classList.remove("hidden");
      containerEl.innerHTML = "";
      statsEl.textContent = "Łuki: 0";
      downloadEl.disabled = true;
      currentActiveSeries = [];
    }

    renderLegend(parsedLines);
  }

  function mirrorNotationString(text: string): string {
    return text.replace(/[lLpP]/g, (char) => {
      if (char === 'l') return 'p';
      if (char === 'L') return 'P';
      if (char === 'p') return 'l';
      if (char === 'P') return 'L';
      return char;
    });
  }

  function mirrorBlockInTextarea(blockIndex: number) {
    const text = textareaEl.value;
    const words = text.split(/(\s+)/);
    if (blockIndex * 2 < words.length) {
      words[blockIndex * 2] = mirrorNotationString(words[blockIndex * 2]);
      
      const start = textareaEl.selectionStart;
      const end = textareaEl.selectionEnd;
      
      textareaEl.value = words.join("");
      
      textareaEl.setSelectionRange(start, end);
      renderCurves();
    }
  }

  function renderLegend(parsedLines: ParsedLine[]) {
    legendContainerEl.innerHTML = "";

    parsedLines.forEach((item, idx) => {
      const row = document.createElement("div");
      row.className = "series-legend-row";
      row.dataset.id = item.id;

      // 1. Info container (Number + label)
      const info = document.createElement("div");
      info.className = "series-legend-info";
      info.style.color = colorMode === 'color' ? item.color : "var(--text-primary)";

      const numSpan = document.createElement("span");
      numSpan.className = "series-legend-num";
      numSpan.textContent = `Seria ${idx + 1}:`;
      numSpan.title = "Kliknij, aby skopiować notację tej serii";
      
      numSpan.addEventListener("click", () => {
        navigator.clipboard.writeText(item.notation).then(() => {
          const originalText = numSpan.textContent;
          numSpan.textContent = "Skopiowano!";
          numSpan.style.color = "var(--success-color, #16a34a)";
          setTimeout(() => {
            numSpan.textContent = originalText;
            numSpan.style.color = "";
          }, 1000);
        }).catch(err => {
          console.error("Copy failed: ", err);
        });
      });

      const parsedSpan = document.createElement("span");
      parsedSpan.className = "series-legend-parsed";
      parsedSpan.textContent = item.notation;

      info.appendChild(numSpan);
      info.appendChild(parsedSpan);
      row.appendChild(info);

      // 2. Mirror button (placed to the left of focus button)
      const mirrorBtn = document.createElement("button");
      mirrorBtn.className = "btn-icon";
      mirrorBtn.title = "Odbicie lustrzane (zamień L ↔ P)";
      mirrorBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="2" x2="12" y2="22" stroke-dasharray="3"></line>
          <polyline points="8 6 4 10 8 14"></polyline>
          <polyline points="16 6 20 10 16 14"></polyline>
        </svg>
      `;
      mirrorBtn.addEventListener("click", () => {
        mirrorBlockInTextarea(item.lineIndex);
      });
      row.appendChild(mirrorBtn);

      // 3. Focus button (loupe)
      const focusBtn = document.createElement("button");
      focusBtn.className = "btn-icon focus-btn";
      if (focusedSeriesId === item.id) {
        focusBtn.classList.add("active");
      }
      focusBtn.title = "Skup się na tej serii (wycisz inne)";
      focusBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      `;
      focusBtn.addEventListener("click", () => {
        if (focusedSeriesId === item.id) {
          focusedSeriesId = null;
        } else {
          focusedSeriesId = item.id;
          lineVisibility[item.lineIndex] = true;
        }
        renderCurves();
      });
      row.appendChild(focusBtn);

      // 4. Visibility button (eye)
      const visibilityBtn = document.createElement("button");
      visibilityBtn.className = "btn-icon";
      visibilityBtn.title = "Włącz/Wyłącz widoczność";
      const isVisible = lineVisibility[item.lineIndex] !== false;
      visibilityBtn.innerHTML = getEyeIcon(isVisible);
      visibilityBtn.addEventListener("click", () => {
        const nextVisible = !isVisible;
        lineVisibility[item.lineIndex] = nextVisible;

        if (!nextVisible && focusedSeriesId === item.id) {
          focusedSeriesId = null;
        }
        renderCurves();
      });
      row.appendChild(visibilityBtn);

      legendContainerEl.appendChild(row);
    });
  }

  // Event Listeners
  textareaEl.addEventListener("input", renderCurves);
  textareaEl.addEventListener("paste", () => {
    setTimeout(renderCurves, 0);
  });

  containerEl.addEventListener("click", () => {
    startAnimation();
  });

  if (colorModeBtn) {
    colorModeBtn.addEventListener("click", () => {
      colorMode = colorMode === 'color' ? 'mono' : 'color';
      renderCurves();
    });
  }

  downloadEl.addEventListener("click", () => {
    if (currentActiveSeries.length > 0) {
      const combinedNotation = currentActiveSeries
        .map(s => s.notation.trim())
        .filter(n => n.length > 0)
        .join("_");
      downloadSVG(currentActiveSeries, combinedNotation);
    }
  });

  // Prevent browser default drop behavior globally so it doesn't open the file,
  // but preserve default drag-and-drop on the textarea.
  window.addEventListener("dragover", (e) => {
    e.preventDefault();
  }, false);

  window.addEventListener("drop", (e) => {
    if (e.target !== textareaEl) {
      e.preventDefault();
    }
  }, false);

  // Drag and drop .txt files onto the curve preview area
  const dragOverlay = document.getElementById("drag-overlay") as HTMLDivElement;
  let dragCounter = 0;

  containerEl.addEventListener("dragenter", (e) => {
    e.preventDefault();
    dragCounter++;
    if (dragOverlay) {
      dragOverlay.classList.remove("hidden");
    }
  });

  containerEl.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  containerEl.addEventListener("dragleave", (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0 && dragOverlay) {
      dragCounter = 0;
      dragOverlay.classList.add("hidden");
    }
  });

  containerEl.addEventListener("drop", (e) => {
    e.preventDefault();
    dragCounter = 0;
    if (dragOverlay) {
      dragOverlay.classList.add("hidden");
    }

    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      // Try to read all dropped files as text (more resilient on Linux filesystems)
      if (files.length > 0) {
        const filePromises = files.map(file => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              resolve(event.target?.result as string || '');
            };
            reader.readAsText(file);
          });
        });

        Promise.all(filePromises).then((contents) => {
          const joinedText = contents
            .map(c => c.trim())
            .filter(c => c.length > 0)
            .join("\n");

          if (joinedText.length > 0) {
            textareaEl.value = joinedText;
            renderCurves();
            startAnimation();
          }
        });
      }
    }
  });

  // Saved Curves Library Logic
  const libraryBtn = document.getElementById("library-btn") as HTMLButtonElement;
  const libraryModal = document.getElementById("library-modal") as HTMLDivElement;
  const modalCloseBtn = document.getElementById("modal-close-btn") as HTMLButtonElement;
  const saveLayoutBtn = document.getElementById("save-layout-btn") as HTMLButtonElement;
  const saveLayoutNameInput = document.getElementById("save-layout-name") as HTMLInputElement;
  const saveErrorEl = document.getElementById("save-error") as HTMLDivElement;
  const savedLayoutsListEl = document.getElementById("saved-layouts-list") as HTMLDivElement;
  const importLayoutsBtn = document.getElementById("import-layouts-btn") as HTMLButtonElement;

  const STORAGE_KEY = "bosacki_saved_layouts";

  interface SavedLayout {
    id: string;
    name: string;
    notation: string;
    timestamp: number;
  }

  function loadSavedLayouts(): SavedLayout[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to load saved layouts:", e);
      return [];
    }
  }

  function saveSavedLayouts(layouts: SavedLayout[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
    } catch (e) {
      console.error("Failed to save layouts to storage:", e);
    }
  }

  function openLibraryModal() {
    if (libraryModal) {
      libraryModal.classList.remove("hidden");
      saveLayoutNameInput.value = "";
      saveErrorEl.textContent = "";
      saveErrorEl.classList.add("hidden");
      refreshLibraryList();
    }
  }

  function closeLibraryModal() {
    if (libraryModal) {
      libraryModal.classList.add("hidden");
    }
  }

  function refreshLibraryList() {
    if (!savedLayoutsListEl) return;
    savedLayoutsListEl.innerHTML = "";
    
    const layouts = loadSavedLayouts();
    if (layouts.length === 0) {
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "layouts-list-empty";
      emptyDiv.textContent = "Brak zapisanych układów w bibliotece.";
      savedLayoutsListEl.appendChild(emptyDiv);
      importLayoutsBtn.disabled = true;
      return;
    }

    // Sort by timestamp descending (newest first)
    layouts.sort((a, b) => b.timestamp - a.timestamp);

    layouts.forEach(layout => {
      const row = document.createElement("div");
      row.className = "layout-item-row";
      row.dataset.id = layout.id;

      // Checkbox
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "layout-checkbox";
      checkbox.addEventListener("change", updateImportButtonState);

      // Info block (clickable to toggle checkbox)
      const info = document.createElement("div");
      info.className = "layout-item-info";
      info.addEventListener("click", () => {
        checkbox.checked = !checkbox.checked;
        updateImportButtonState();
      });

      const nameSpan = document.createElement("span");
      nameSpan.className = "layout-item-name";
      nameSpan.textContent = layout.name;

      const previewSpan = document.createElement("span");
      previewSpan.className = "layout-item-preview";
      previewSpan.textContent = layout.notation;

      info.appendChild(nameSpan);
      info.appendChild(previewSpan);

      // Delete Button
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn-icon";
      deleteBtn.title = "Usuń z biblioteki";
      deleteBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      `;
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // Avoid triggering info click/checkbox toggle
        if (confirm(`Czy na pewno chcesz usunąć układ "${layout.name}"?`)) {
          const currentLayouts = loadSavedLayouts();
          const filtered = currentLayouts.filter(l => l.id !== layout.id);
          saveSavedLayouts(filtered);
          refreshLibraryList();
        }
      });

      row.appendChild(checkbox);
      row.appendChild(info);
      row.appendChild(deleteBtn);

      savedLayoutsListEl.appendChild(row);
    });

    updateImportButtonState();
  }

  function updateImportButtonState() {
    const checkboxes = savedLayoutsListEl.querySelectorAll(".layout-checkbox") as NodeListOf<HTMLInputElement>;
    const anyChecked = Array.from(checkboxes).some(cb => cb.checked);
    importLayoutsBtn.disabled = !anyChecked;
  }

  if (libraryBtn) {
    libraryBtn.addEventListener("click", openLibraryModal);
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", closeLibraryModal);
  }

  if (libraryModal) {
    libraryModal.addEventListener("click", (e) => {
      if (e.target === libraryModal) {
        closeLibraryModal();
      }
    });
  }

  if (saveLayoutBtn) {
    saveLayoutBtn.addEventListener("click", () => {
      saveErrorEl.textContent = "";
      saveErrorEl.classList.add("hidden");

      const name = saveLayoutNameInput.value.trim();
      if (!name) {
        saveErrorEl.textContent = "Podaj nazwę układu.";
        saveErrorEl.classList.remove("hidden");
        return;
      }

      const notation = textareaEl.value.trim();
      if (!notation) {
        saveErrorEl.textContent = "Pole notacji jest puste. Wpisz coś przed zapisaniem.";
        saveErrorEl.classList.remove("hidden");
        return;
      }

      const layouts = loadSavedLayouts();
      
      const exists = layouts.some(l => l.name.toLowerCase() === name.toLowerCase());
      if (exists) {
        if (!confirm(`Układ o nazwie "${name}" już istnieje w bibliotece. Czy chcesz go zastąpić?`)) {
          return;
        }
      }

      const filteredLayouts = layouts.filter(l => l.name.toLowerCase() !== name.toLowerCase());
      filteredLayouts.push({
        id: `layout_${Date.now()}`,
        name,
        notation,
        timestamp: Date.now()
      });

      saveSavedLayouts(filteredLayouts);
      saveLayoutNameInput.value = "";
      refreshLibraryList();
    });
  }

  if (importLayoutsBtn) {
    importLayoutsBtn.addEventListener("click", () => {
      const checkedRows = savedLayoutsListEl.querySelectorAll(".layout-item-row") as NodeListOf<HTMLDivElement>;
      const selectedLayouts: SavedLayout[] = [];
      const layouts = loadSavedLayouts();

      checkedRows.forEach(row => {
        const checkbox = row.querySelector(".layout-checkbox") as HTMLInputElement;
        if (checkbox && checkbox.checked) {
          const id = row.dataset.id;
          const layout = layouts.find(l => l.id === id);
          if (layout) {
            selectedLayouts.push(layout);
          }
        }
      });

      if (selectedLayouts.length > 0) {
        // Reverse them so they are appended in chronological order (oldest first)
        selectedLayouts.reverse();
        
        const joinedNotations = selectedLayouts
          .map(l => l.notation.trim())
          .filter(n => n.length > 0)
          .join("\n");

        if (joinedNotations.length > 0) {
          textareaEl.value = joinedNotations;
          renderCurves();
          closeLibraryModal();
          startAnimation();
        }
      }
    });
  }

  // Initial load
  renderCurves();
  startAnimation();
}

// Execute initialization safely depending on page load state
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

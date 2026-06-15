// SVG Renderer and UI Controller for Piotr Bosacki's Curves (Parkietaż)

interface ActiveSeries {
  id: string;
  arcs: ArcSegment[];
  color: string;
  notation: string;
}

interface SeriesStateItem {
  id: string;
  notation: string;
  visible: boolean;
  color: string;
}

const COLOR_PALETTE = [
  "#000000", // Czarny
  "#2563eb", // Niebieski (Royal Blue)
  "#dc2626", // Czerwony (Ruby Red)
  "#16a34a", // Zielony (Forest Green)
  "#7c3aed", // Fioletowy (Purple)
  "#ea580c"  // Pomarańczowy (Orange)
];

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
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", colorMode === 'color' ? s.color : "#000000");
    path.setAttribute("stroke-width", strokeWidth);
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    
    // Apply focus dimming if another series is focused
    if (focusedSeriesId !== null && s.id !== focusedSeriesId) {
      path.setAttribute("opacity", "0.15");
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
    const opacityAttr = isDimmed ? ' opacity="0.15"' : '';
    
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
  const seriesContainerEl = document.getElementById("series-container") as HTMLDivElement;
  const addSeriesBtn = document.getElementById("add-series-btn") as HTMLButtonElement;
  const colorModeBtn = document.getElementById("color-mode-btn") as HTMLButtonElement;

  // Initial state with one series (Seria A)
  let seriesList: SeriesStateItem[] = [
    {
      id: "series_0",
      notation: "1p2p3p4p5l6l7l6l5p4p3p2p1l2l3l4l5p6p7p6p5l4l3l2l",
      visible: true,
      color: getColorForIndex(0)
    }
  ];

  let seriesCounter = 1;
  let currentActiveSeries: ActiveSeries[] = [];

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
    errorEl.textContent = "";
    errorEl.classList.add("hidden");

    const visibleSeriesList = seriesList.filter(s => s.visible && s.notation.trim().length > 0);

    if (visibleSeriesList.length === 0) {
      errorEl.textContent = "Wpisz notację np: 1p2p3p4p5l6l7l6l5p4p3p2p1l2l3l4l5p6p7p6p5l4l3l2l - Seria A";
      errorEl.classList.remove("hidden");
      containerEl.innerHTML = "";
      statsEl.textContent = "Łuki: 0";
      downloadEl.disabled = true;
      currentActiveSeries = [];
      return;
    }

    const activeSeries: ActiveSeries[] = [];
    let parsingError = false;
    let totalArcs = 0;

    for (const item of visibleSeriesList) {
      const modules = parseNotation(item.notation);
      if (modules.length === 0) {
        parsingError = true;
        continue;
      }

      try {
        const arcs = generateArcs(modules);
        totalArcs += arcs.length;
        activeSeries.push({
          id: item.id,
          arcs,
          color: item.color,
          notation: item.notation
        });
      } catch (err: any) {
        errorEl.textContent = `Błąd generowania: ${err.message}`;
        errorEl.classList.remove("hidden");
        containerEl.innerHTML = "";
        statsEl.textContent = "Łuki: 0";
        downloadEl.disabled = true;
        currentActiveSeries = [];
        return;
      }
    }

    if (parsingError && activeSeries.length === 0) {
      errorEl.textContent = "Błąd: Nie znaleziono poprawnych modułów w notacji. Użyj formatu [rozmiar][L/P] (np. 1p2p).";
      errorEl.classList.remove("hidden");
      containerEl.innerHTML = "";
      statsEl.textContent = "Łuki: 0";
      downloadEl.disabled = true;
      currentActiveSeries = [];
      return;
    }

    // Render the SVG curves
    try {
      const svg = generateSVGElement(activeSeries);
      containerEl.innerHTML = "";
      containerEl.appendChild(svg);
      currentActiveSeries = activeSeries;

      statsEl.textContent = `Łuki: ${totalArcs}`;

      // Check if all active series' notations end with a direction letter
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
  }

  function createSeriesRowDOM(item: SeriesStateItem): HTMLDivElement {
    const row = document.createElement("div");
    row.className = "series-row";
    row.dataset.id = item.id;

    // 1. Input wrapper (Left side)
    const wrapper = document.createElement("div");
    wrapper.className = "input-wrapper";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Wpisz notację np: 1p2p3p4p5l6l7l6l5p4p3p2p1l2l3l4l5p6p7p6p5l4l3l2l - Seria A";
    input.value = item.notation;
    input.spellcheck = false;
    input.autocomplete = "off";

    input.addEventListener("input", () => {
      const start = input.selectionStart;
      const originalValue = input.value;
      
      let filteredValue = "";
      for (let i = 0; i < originalValue.length; i++) {
        const char = originalValue[i];
        if (filteredValue.length % 2 === 0) {
          if (/[1-7]/.test(char)) filteredValue += char;
        } else {
          if (/[lLpP]/.test(char)) filteredValue += char;
        }
      }

      if (originalValue !== filteredValue) {
        input.value = filteredValue;
        if (start !== null) {
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
          input.setSelectionRange(cursorPosition, cursorPosition);
        }
      }

      item.notation = input.value.trim();
      renderCurves();
    });

    wrapper.appendChild(input);
    row.appendChild(wrapper);

    // 2. Color badge (Right of text field)
    const badge = document.createElement("div");
    badge.className = "color-badge";
    badge.style.backgroundColor = item.color;
    row.appendChild(badge);

    // 3. Visibility button
    const visibilityBtn = document.createElement("button");
    visibilityBtn.className = "btn-icon";
    visibilityBtn.title = "Włącz/Wyłącz widoczność";
    visibilityBtn.innerHTML = getEyeIcon(item.visible);
    visibilityBtn.addEventListener("click", () => {
      item.visible = !item.visible;
      visibilityBtn.innerHTML = getEyeIcon(item.visible);

      // If we just hid the focused series, clear the focus
      if (!item.visible && focusedSeriesId === item.id) {
        focusedSeriesId = null;
        // Reset all focus buttons to inactive
        const allFocusButtons = seriesContainerEl.querySelectorAll(".focus-btn");
        allFocusButtons.forEach(btn => btn.classList.remove("active"));
      }

      renderCurves();
    });

    // 4. Focus button (loupe icon)
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
        // Auto-show the series if it was hidden
        if (!item.visible) {
          item.visible = true;
          visibilityBtn.innerHTML = getEyeIcon(true);
        }
      }

      // Update all focus button active states visually
      const allFocusButtons = seriesContainerEl.querySelectorAll(".focus-btn");
      allFocusButtons.forEach((btn, idx) => {
        const rowId = seriesList[idx].id;
        if (rowId === focusedSeriesId) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });

      renderCurves();
    });

    row.appendChild(focusBtn);
    row.appendChild(visibilityBtn);

    // 5. Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-icon";
    deleteBtn.title = "Usuń serię";
    deleteBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;
    deleteBtn.addEventListener("click", () => {
      removeSeries(item.id);
    });
    row.appendChild(deleteBtn);

    return row;
  }

  function refreshSeriesUI() {
    seriesContainerEl.innerHTML = "";
    seriesList.forEach((item) => {
      const row = createSeriesRowDOM(item);
      seriesContainerEl.appendChild(row);
    });

    // Disable delete buttons if only 1 row remains
    const deleteButtons = seriesContainerEl.querySelectorAll(".btn-icon:last-child") as NodeListOf<HTMLButtonElement>;
    if (seriesList.length === 1 && deleteButtons.length === 1) {
      deleteButtons[0].disabled = true;
    }
  }

  function addSeries() {
    const nextIndex = seriesList.length;
    const newId = `series_${Date.now()}_${seriesCounter}`;
    const nextColor = getColorForIndex(seriesCounter);
    seriesCounter++;

    seriesList.push({
      id: newId,
      notation: "",
      visible: true,
      color: nextColor
    });

    refreshSeriesUI();
    renderCurves();

    // Focus the newly added input
    const inputs = seriesContainerEl.querySelectorAll("input[type='text']") as NodeListOf<HTMLInputElement>;
    if (inputs.length > 0) {
      inputs[inputs.length - 1].focus();
    }
  }

  function removeSeries(id: string) {
    if (seriesList.length <= 1) return;
    if (focusedSeriesId === id) {
      focusedSeriesId = null;
    }
    seriesList = seriesList.filter(s => s.id !== id);
    refreshSeriesUI();
    renderCurves();
  }

  // Event Listeners
  addSeriesBtn.addEventListener("click", addSeries);

  colorModeBtn.addEventListener("click", () => {
    colorMode = colorMode === 'color' ? 'mono' : 'color';
    colorModeBtn.querySelector("span")!.textContent = colorMode === 'color' ? "Kolor" : "Mono";
    
    if (colorMode === 'mono') {
      colorModeBtn.classList.add("btn-primary");
      colorModeBtn.classList.remove("btn-secondary");
    } else {
      colorModeBtn.classList.add("btn-secondary");
      colorModeBtn.classList.remove("btn-primary");
    }
    
    renderCurves();
  });

  downloadEl.addEventListener("click", () => {
    if (currentActiveSeries.length > 0) {
      const combinedNotation = currentActiveSeries
        .map(s => s.notation.trim())
        .filter(n => n.length > 0)
        .join("_");
      downloadSVG(currentActiveSeries, combinedNotation);
    }
  });

  // Initial load
  refreshSeriesUI();
  renderCurves();
}

// Execute initialization safely depending on page load state
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

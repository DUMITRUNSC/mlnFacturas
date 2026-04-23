/**
 * Shared utilities for PDF generation.
 * No drawing logic here — just file I/O, asset loading, and number/date helpers.
 */

/* ─── File save (File System Access API with fallback) ───────────────────── */
export async function savePDFFile(pdf, filename) {
  if (typeof window.showSaveFilePicker !== "function") {
    pdf.save(filename);
    return;
  }
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [{ description: "PDF", accept: { "application/pdf": [".pdf"] } }],
    });
    const writable = await handle.createWritable();
    await writable.write(pdf.output("blob"));
    await writable.close();
  } catch {
    pdf.save(filename);
  }
}

/* ─── SVG → PNG rasteriser ───────────────────────────────────────────────── */
async function loadSvgAsPng(svgPath, size = 600) {
  const resp = await fetch(svgPath);
  if (!resp.ok) return null;
  const svgText   = await resp.text();
  const svgBase64 = window.btoa(unescape(encodeURIComponent(svgText)));
  const img = new Image();
  img.src   = "data:image/svg+xml;base64," + svgBase64;
  await (img.decode ? img.decode() : new Promise((res) => (img.onload = res)));
  const canvas = document.createElement("canvas");
  canvas.width  = size;
  canvas.height = size;
  canvas.getContext("2d").drawImage(img, 0, 0, size, size);
  return canvas.toDataURL("image/png");
}

/* ─── Asset loaders ──────────────────────────────────────────────────────── */
export async function loadLogo() {
  try {
    return await loadSvgAsPng("/logo.svg", 300);
  } catch {
    return null;
  }
}

export async function loadSignature() {
  try {
    const png = await loadSvgAsPng("/firma.svg", 800);
    if (png) return png;
  } catch {}

  for (const ext of ["/firma.png", "/firma.jpg"]) {
    try {
      const r = await fetch(ext);
      if (!r.ok) continue;
      const blob = await r.blob();
      return await new Promise((res) => {
        const fr = new FileReader();
        fr.onload = () => res(fr.result);
        fr.readAsDataURL(blob);
      });
    } catch {}
  }
  return null;
}

/* ─── Number / date helpers ──────────────────────────────────────────────── */
export function normalizeNumAndYear(raw) {
  const t = String(raw || "").trim();
  let yearPart = "", numPart = "";
  if (/^\d{4}\s*[_/]\s*\d{1,4}$/.test(t)) {
    [yearPart, numPart] = t.split(/[/_]/).map((s) => s.trim());
  } else {
    yearPart = String(new Date().getFullYear());
    numPart  = String(parseInt(t, 10) || 0);
  }
  return {
    year4: String(parseInt(yearPart)).padStart(4, "0"),
    num4:  String(parseInt(numPart)).padStart(4, "0"),
  };
}

export function formatFechaES(fecha) {
  if (fecha instanceof Date) {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, "0");
    const d = String(fecha.getDate()).padStart(2, "0");
    return `${d}/${m}/${y}`;
  }
  if (typeof fecha === "string" && fecha) {
    const parts = fecha.replace(/\./g, "-").replace(/\//g, "-").split("-");
    return parts.length === 3
      ? `${parts[2].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[0]}`
      : fecha;
  }
  const now = new Date();
  return `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
}

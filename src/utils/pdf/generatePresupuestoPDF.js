/**
 * PDF Presupuesto — diseño profesional.
 * Paleta: azul corporativo + gris oscuro.
 */
import { jsPDF }   from "jspdf";
import autoTable   from "jspdf-autotable";
import {
  savePDFFile, loadLogo, loadSignature,
  normalizeNumAndYear, formatFechaES,
} from "./pdfShared.js";

/* ─── Design tokens ───────────────────────────────────────────────────────── */
const C = {
  blue:       [37,  99,  235],   // brand blue-600
  blueDark:   [29,  78,  216],   // blue-700
  blueLight:  [219, 234, 254],   // blue-100
  slate900:   [15,  23,  42],
  slate700:   [51,  65,  85],
  slate500:   [100, 116, 139],
  slate200:   [226, 232, 240],
  slate100:   [241, 245, 249],
  slate50:    [248, 250, 252],
  white:      [255, 255, 255],
  gold:       [217, 119,  6],
};

const MARGINS  = { top: 15, right: 18, bottom: 15, left: 18 };
const HEADER_H = 52;   // reserved for repeating header
const FOOTER_H = 14;

function box(pdf) {
  const pageW    = pdf.internal.pageSize.getWidth();
  const pageH    = pdf.internal.pageSize.getHeight();
  const contentW = pageW - MARGINS.left - MARGINS.right;
  return {
    pageW, pageH, contentW,
    safeTop:    MARGINS.top + HEADER_H,
    safeBottom: pageH - MARGINS.bottom - FOOTER_H,
  };
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const rgb = (arr) => ({ r: arr[0], g: arr[1], b: arr[2] });
function setFill(pdf, arr)   { pdf.setFillColor(...arr); }
function setDraw(pdf, arr)   { pdf.setDrawColor(...arr); }
function setTxt(pdf, arr)    { pdf.setTextColor(...arr); }

function filledRect(pdf, x, y, w, h, color, radius = 0) {
  setFill(pdf, color);
  if (radius > 0) pdf.roundedRect(x, y, w, h, radius, radius, "F");
  else            pdf.rect(x, y, w, h, "F");
}

function eur(n) {
  return Number(n).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

/* ─── Main export ─────────────────────────────────────────────────────────── */
export async function generatePresupuestoPDF({ formData, business }) {
  const {
    numero, clienteNombre, clienteApellidos,
    clienteCIF, clienteDireccion, clienteCP, clienteLocalidad, clienteProvincia,
    iva: ivaPctGlobal, items: servicios = [], comentarios,
  } = formData;

  const {
    companyName = "Mi Empresa", nif = "", phone = "",
    street = "", postalCode = "", locality = "", community = "",
  } = business || {};

  /* Computed */
  const { year4: nfYear, num4: nfNum } = normalizeNumAndYear(numero);
  const docRef      = `${nfYear}_${nfNum}`;
  const fechaES     = formatFechaES(formData.fecha);
  const cliCompleto = [clienteNombre, clienteApellidos].filter(Boolean).join(" ").trim();
  const cliForFile  = (cliCompleto || "Cliente").replace(/[\\/:*?"<>|]+/g, "_").replace(/\s+/g, " ");
  const filename    = `Presupuesto MLN - ${cliForFile} - ${docRef}.pdf`;

  const totalBase  = servicios.reduce((s, x) => s + (x.total  ?? x.quantity * x.price), 0);
  const totalIVA   = servicios.reduce((s, x) => s + (x.ivaAmount ?? x.quantity * x.price * ((x.iva ?? ivaPctGlobal) / 100)), 0);
  const totalFinal = totalBase + totalIVA;

  /* Assets */
  const [logoPng, signaturePng] = await Promise.all([loadLogo(), loadSignature()]);

  /* PDF */
  const pdf  = new jsPDF({ unit: "mm", format: "a4" });
  let curY   = 0;

  const resetCursor = () => { curY = box(pdf).safeTop; };
  const ensureSpace = (h) => {
    if (curY + h > box(pdf).safeBottom) {
      pdf.addPage();
      drawHeader();
      curY = box(pdf).safeTop;
    }
  };

  /* ── HEADER (repeats every page) ────────────────────────────────────────── */
  function drawHeader() {
    const { pageW } = box(pdf);
    const barH = 16;

    /* Top color bar */
    filledRect(pdf, 0, 0, pageW, barH, C.blue);

    /* Brand name in bar */
    setTxt(pdf, C.white);
    pdf.setFont(undefined, "bold").setFontSize(9);
    pdf.text(companyName.toUpperCase(), MARGINS.left, barH - 4.5);

    /* Doc type + number in bar (right) */
    pdf.setFont(undefined, "normal").setFontSize(8);
    const docLabel = `PRESUPUESTO  ${nfNum} / ${nfYear}`;
    pdf.text(docLabel, pageW - MARGINS.right, barH - 4.5, { align: "right" });

    /* Logo (right side of bar if available) */
    if (logoPng) {
      const lW = 12, lH = 12;
      const lX = pageW - MARGINS.right - lW - 70;
      pdf.addImage(logoPng, "PNG", lX, (barH - lH) / 2, lW, lH);
    }

    /* Sub-bar: fecha + validez */
    filledRect(pdf, 0, barH, pageW, 8, C.blueLight);
    setTxt(pdf, C.blue);
    pdf.setFont(undefined, "normal").setFontSize(7.5);
    if (fechaES) pdf.text(`Fecha de emisión: ${fechaES}`, MARGINS.left, barH + 5.5);
    pdf.text("Validez: 30 días", pageW - MARGINS.right, barH + 5.5, { align: "right" });

    /* Separator */
    setDraw(pdf, C.slate200);
    pdf.setLineWidth(0.3);
    pdf.line(MARGINS.left, barH + 8 + 3, pageW - MARGINS.right, barH + 8 + 3);
  }

  /* ── FOOTER ──────────────────────────────────────────────────────────────── */
  function drawFooter() {
    const { pageW, pageH } = box(pdf);
    const y = pageH - MARGINS.bottom - FOOTER_H + 2;

    setDraw(pdf, C.slate200);
    pdf.setLineWidth(0.2);
    pdf.line(MARGINS.left, y, pageW - MARGINS.right, y);

    filledRect(pdf, MARGINS.left, y + 1, pageW - MARGINS.left - MARGINS.right, FOOTER_H - 1, C.slate50);

    setTxt(pdf, C.slate500);
    pdf.setFont(undefined, "normal").setFontSize(7);
    const contact = [nif && `NIF: ${nif}`, phone && `Tel: ${phone}`, [street, postalCode, locality].filter(Boolean).join(", ")].filter(Boolean).join("  ·  ");
    pdf.text(contact, MARGINS.left + 2, y + 7);

    const pageNum = pdf.getCurrentPageInfo().pageNumber;
    pdf.text(`Pág. ${pageNum}`, pageW - MARGINS.right - 2, y + 7, { align: "right" });
  }

  /* ── PARTIES ─────────────────────────────────────────────────────────────── */
  function drawParties() {
    const { contentW } = box(pdf);
    const colW  = (contentW - 8) / 2;
    const cardH = 38;
    const y0    = curY;

    ensureSpace(cardH + 6);

    /* Emisor card */
    filledRect(pdf, MARGINS.left, y0, colW, cardH, C.slate50, 2);
    setDraw(pdf, C.blue);
    pdf.setLineWidth(0.8);
    pdf.line(MARGINS.left, y0, MARGINS.left, y0 + cardH);

    setTxt(pdf, C.blue);
    pdf.setFont(undefined, "bold").setFontSize(7);
    pdf.text("EMISOR", MARGINS.left + 4, y0 + 6);

    setTxt(pdf, C.slate900);
    pdf.setFont(undefined, "bold").setFontSize(10);
    pdf.text(companyName, MARGINS.left + 4, y0 + 13);

    setTxt(pdf, C.slate500);
    pdf.setFont(undefined, "normal").setFontSize(8.5);
    const emisorLines = [
      nif   && `NIF/CIF: ${nif}`,
      phone && `Tel: ${phone}`,
      [street, postalCode, locality, community].filter(Boolean).join(", "),
    ].filter(Boolean);
    pdf.text(emisorLines, MARGINS.left + 4, y0 + 20, { maxWidth: colW - 8, lineHeightFactor: 1.5 });

    /* Cliente card */
    const cx = MARGINS.left + colW + 8;
    filledRect(pdf, cx, y0, colW, cardH, C.slate50, 2);
    setDraw(pdf, C.slate500);
    pdf.setLineWidth(0.8);
    pdf.line(cx, y0, cx, y0 + cardH);

    setTxt(pdf, C.slate500);
    pdf.setFont(undefined, "bold").setFontSize(7);
    pdf.text("CLIENTE / DESTINATARIO", cx + 4, y0 + 6);

    setTxt(pdf, C.slate900);
    pdf.setFont(undefined, "bold").setFontSize(10);
    const nombreCli = [clienteNombre, clienteApellidos].filter(Boolean).join(" ");
    pdf.text(nombreCli, cx + 4, y0 + 13, { maxWidth: colW - 8 });

    setTxt(pdf, C.slate500);
    pdf.setFont(undefined, "normal").setFontSize(8.5);
    const cliLines = [
      clienteCIF && `CIF/NIF: ${clienteCIF}`,
      clienteDireccion,
      [clienteCP, clienteLocalidad, clienteProvincia].filter(Boolean).join(", "),
    ].filter(Boolean);
    pdf.text(cliLines, cx + 4, y0 + 20, { maxWidth: colW - 8, lineHeightFactor: 1.5 });

    curY = y0 + cardH + 8;
  }

  /* ── DESCRIPTION / COMMENTS ─────────────────────────────────────────────── */
  function drawComments() {
    if (!comentarios?.trim()) return;
    ensureSpace(20);

    const { contentW } = box(pdf);

    filledRect(pdf, MARGINS.left, curY, contentW, 7, C.slate100, 1);
    setTxt(pdf, C.slate700);
    pdf.setFont(undefined, "bold").setFontSize(8);
    pdf.text("DESCRIPCIÓN DEL TRABAJO", MARGINS.left + 4, curY + 5);
    curY += 9;

    setTxt(pdf, C.slate700);
    pdf.setFont(undefined, "normal").setFontSize(9);
    const lines  = pdf.splitTextToSize(comentarios.trim(), contentW - 8);
    const needed = lines.length * 5;
    ensureSpace(needed + 4);

    filledRect(pdf, MARGINS.left, curY, contentW, needed + 6, C.slate50);
    setDraw(pdf, C.slate200);
    pdf.setLineWidth(0.2);
    pdf.rect(MARGINS.left, curY, contentW, needed + 6, "S");

    pdf.text(lines, MARGINS.left + 4, curY + 5.5, { maxWidth: contentW - 8 });
    curY += needed + 10;
  }

  /* ── ITEMS TABLE ─────────────────────────────────────────────────────────── */
  function drawTable() {
    if (!servicios.length) return;
    const { contentW } = box(pdf);
    const startY = curY;

    const fixed  = { idx: 9, cant: 14, und: 14, pUnit: 22, ivaPct: 13, ivaAmt: 20, total: 26 };
    const fixedT = Object.values(fixed).reduce((a, b) => a + b, 0);
    const descW  = Math.max(38, contentW - fixedT - 2);

    autoTable(pdf, {
      startY,
      margin:     { left: MARGINS.left, right: MARGINS.right, top: MARGINS.top + HEADER_H, bottom: MARGINS.bottom + FOOTER_H },
      tableWidth: contentW,
      theme:      "plain",
      head: [[
        "#", "Descripción del trabajo", "Cant.", "Und.", "P.Unit €", "IVA%", "IVA €", "Total €",
      ]],
      body: servicios.map((s, i) => [
        String(i + 1),
        String(s.description || ""),
        String(s.quantity),
        s.unit === "Unidades" ? "Unid." : s.unit,
        Number(s.price).toFixed(2),
        `${Number(s.iva ?? ivaPctGlobal).toFixed(0)}%`,
        Number(s.ivaAmount ?? s.quantity * s.price * ((s.iva ?? ivaPctGlobal) / 100)).toFixed(2),
        Number(s.totalWithIVA ?? s.quantity * s.price * (1 + (s.iva ?? ivaPctGlobal) / 100)).toFixed(2),
      ]),
      styles: {
        fontSize: 8.5, cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
        overflow: "linebreak", valign: "top", textColor: rgb(C.slate700),
      },
      headStyles: {
        fillColor: rgb(C.blue), textColor: rgb(C.white),
        fontStyle: "bold", fontSize: 7.5,
        cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
      },
      alternateRowStyles: { fillColor: rgb(C.slate50) },
      columnStyles: {
        0: { cellWidth: fixed.idx,    halign: "center", fontStyle: "bold", textColor: rgb(C.blue) },
        1: { cellWidth: descW },
        2: { cellWidth: fixed.cant,   halign: "center" },
        3: { cellWidth: fixed.und,    halign: "center", textColor: rgb(C.slate500), fontSize: 7.5 },
        4: { cellWidth: fixed.pUnit,  halign: "right",  fontStyle: "bold" },
        5: { cellWidth: fixed.ivaPct, halign: "center", textColor: rgb(C.slate500) },
        6: { cellWidth: fixed.ivaAmt, halign: "right",  textColor: rgb(C.slate500) },
        7: { cellWidth: fixed.total,  halign: "right",  fontStyle: "bold", textColor: rgb(C.blue) },
      },
      rowPageBreak: "avoid",
      pageBreak:    "auto",
      didDrawPage:  () => { drawHeader(); drawFooter(); },
    });

    curY = (pdf.lastAutoTable?.finalY ?? startY) + 6;
  }

  /* ── TOTALS ──────────────────────────────────────────────────────────────── */
  function drawTotals() {
    const { pageW, contentW } = box(pdf);
    const boxW  = 80;
    const boxX  = MARGINS.left + contentW - boxW;

    ensureSpace(46);

    /* Totals card */
    filledRect(pdf, boxX, curY, boxW, 38, C.slate900, 2);

    setTxt(pdf, C.slate500);
    pdf.setFont(undefined, "bold").setFontSize(6.5);
    pdf.text("RESUMEN ECONÓMICO", boxX + 6, curY + 7, { charSpace: 0.5 });

    pdf.setFont(undefined, "normal").setFontSize(8.5);
    setTxt(pdf, C.slate200);
    pdf.text("Base imponible", boxX + 6, curY + 15);
    pdf.text(eur(totalBase),   boxX + boxW - 6, curY + 15, { align: "right" });

    pdf.text("IVA",            boxX + 6, curY + 22);
    pdf.text(eur(totalIVA),    boxX + boxW - 6, curY + 22, { align: "right" });

    /* separator */
    setDraw(pdf, [50, 50, 70]);
    pdf.setLineWidth(0.3);
    pdf.line(boxX + 4, curY + 26, boxX + boxW - 4, curY + 26);

    /* Total row */
    filledRect(pdf, boxX, curY + 27, boxW, 11, C.blue, 0);
    // bottom corners rounded manually via clip is complex; skip rounded bottom for simplicity

    setTxt(pdf, C.white);
    pdf.setFont(undefined, "bold").setFontSize(8);
    pdf.text("TOTAL", boxX + 6, curY + 34);
    pdf.setFontSize(11);
    pdf.text(eur(totalFinal), boxX + boxW - 6, curY + 35, { align: "right" });

    curY += 48;

    /* Validity note */
    ensureSpace(12);
    setTxt(pdf, C.slate500);
    pdf.setFont(undefined, "italic").setFontSize(8);
    pdf.text(
      "Este presupuesto tiene validez de 30 días desde la fecha de emisión. Los precios indicados no incluyen trabajos no especificados.",
      MARGINS.left, curY, { maxWidth: contentW - boxW - 8 }
    );

    curY += 14;

    /* Signature area */
    ensureSpace(34);
    const sigBW   = 74;
    const sigLX   = MARGINS.left;
    const sigRX   = pageW - MARGINS.right - sigBW;

    /* Client signature box */
    filledRect(pdf, sigLX, curY, sigBW, 28, C.slate50, 2);
    setTxt(pdf, C.slate500);
    pdf.setFont(undefined, "bold").setFontSize(7);
    pdf.text("CONFORME — FIRMA DEL CLIENTE", sigLX + 4, curY + 6, { charSpace: 0.3 });
    setDraw(pdf, C.slate200);
    pdf.setLineWidth(0.3);
    pdf.line(sigLX + 4, curY + 23, sigLX + sigBW - 4, curY + 23);

    /* Company signature box */
    filledRect(pdf, sigRX, curY, sigBW, 28, C.blueLight, 2);
    setTxt(pdf, C.blue);
    pdf.setFont(undefined, "bold").setFontSize(7);
    pdf.text("FIRMA DE LA EMPRESA", sigRX + 4, curY + 6, { charSpace: 0.3 });

    if (signaturePng) {
      const sW = 36, sH = 15;
      const sX = sigRX + (sigBW - sW) / 2;
      pdf.addImage(signaturePng, "PNG", sX, curY + 8, sW, sH);
    }
    setDraw(pdf, C.blue);
    pdf.setLineWidth(0.3);
    pdf.line(sigRX + 4, curY + 25, sigRX + sigBW - 4, curY + 25);

    curY += 32;
  }

  /* ── WATERMARK ───────────────────────────────────────────────────────────── */
  function drawWatermarks() {
    if (!logoPng) return;
    const { pageW, pageH } = box(pdf);
    const pages = pdf.internal.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
      pdf.setPage(p);
      pdf.setGState(new pdf.GState({ opacity: 0.04 }));
      pdf.addImage(logoPng, "PNG", pageW / 2 - 30, pageH / 2 - 30, 60, 60);
      pdf.setGState(new pdf.GState({ opacity: 1 }));
    }
  }

  /* ── RENDER ──────────────────────────────────────────────────────────────── */
  drawHeader();
  drawFooter();
  resetCursor();
  drawParties();
  drawComments();
  drawTable();
  drawTotals();
  drawWatermarks();

  await savePDFFile(pdf, filename);
}

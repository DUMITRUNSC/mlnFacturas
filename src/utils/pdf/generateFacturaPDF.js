/**
 * PDF Factura — diseño profesional.
 * Paleta: verde esmeralda corporativo + gris oscuro.
 */
import { jsPDF }   from "jspdf";
import autoTable   from "jspdf-autotable";
import {
  savePDFFile, loadLogo, loadSignature,
  normalizeNumAndYear, formatFechaES,
} from "./pdfShared.js";

/* ─── Design tokens ───────────────────────────────────────────────────────── */
const C = {
  green:      [5,   150, 105],   // emerald-600
  greenDark:  [4,   120,  87],   // emerald-700
  greenLight: [209, 250, 229],   // emerald-100
  slate900:   [15,  23,  42],
  slate700:   [51,  65,  85],
  slate500:   [100, 116, 139],
  slate200:   [226, 232, 240],
  slate100:   [241, 245, 249],
  slate50:    [248, 250, 252],
  white:      [255, 255, 255],
  red:        [220,  38,  38],
};

const MARGINS  = { top: 15, right: 18, bottom: 15, left: 18 };
const HEADER_H = 52;
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

const rgb    = (arr) => ({ r: arr[0], g: arr[1], b: arr[2] });
const setFill = (pdf, arr) => pdf.setFillColor(...arr);
const setDraw = (pdf, arr) => pdf.setDrawColor(...arr);
const setTxt  = (pdf, arr) => pdf.setTextColor(...arr);

function filledRect(pdf, x, y, w, h, color, radius = 0) {
  setFill(pdf, color);
  if (radius > 0) pdf.roundedRect(x, y, w, h, radius, radius, "F");
  else            pdf.rect(x, y, w, h, "F");
}

function eur(n) {
  return Number(n).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

/* ─── Main export ─────────────────────────────────────────────────────────── */
export async function generateFacturaPDF({ formData, business }) {
  const {
    numero, clienteNombre, clienteApellidos,
    clienteCIF, clienteDireccion, clienteCP, clienteLocalidad, clienteProvincia,
    iva: ivaPctGlobal, items: servicios = [], comentarios,
  } = formData;

  const {
    companyName = "Mi Empresa", nif = "", phone = "",
    street = "", postalCode = "", locality = "", community = "",
    bank = "", accountNumber = "", holder = "",
  } = business || {};

  /* Computed */
  const { year4: nfYear, num4: nfNum } = normalizeNumAndYear(numero);
  const docRef      = `${nfYear}_${nfNum}`;
  const fechaES     = formatFechaES(formData.fecha);
  const cliCompleto = [clienteNombre, clienteApellidos].filter(Boolean).join(" ").trim();
  const cliForFile  = (cliCompleto || "Cliente").replace(/[\\/:*?"<>|]+/g, "_").replace(/\s+/g, " ");
  const filename    = `Factura MLN - ${cliForFile} - ${docRef}.pdf`;

  const totalBase  = servicios.reduce((s, x) => s + (x.total  ?? x.quantity * x.price), 0);
  const totalIVA   = servicios.reduce((s, x) => s + (x.ivaAmount ?? x.quantity * x.price * ((x.iva ?? ivaPctGlobal) / 100)), 0);
  const totalFinal = totalBase + totalIVA;

  /* Assets */
  const [logoPng, signaturePng] = await Promise.all([loadLogo(), loadSignature()]);

  /* PDF */
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  let curY  = 0;

  const resetCursor = () => { curY = box(pdf).safeTop; };
  const ensureSpace = (h) => {
    if (curY + h > box(pdf).safeBottom) {
      pdf.addPage();
      drawHeader();
      drawFooter();
      curY = box(pdf).safeTop;
    }
  };

  /* ── HEADER ──────────────────────────────────────────────────────────────── */
  function drawHeader() {
    const { pageW } = box(pdf);
    const barH = 16;

    /* Top color bar */
    filledRect(pdf, 0, 0, pageW, barH, C.green);

    /* Brand name */
    setTxt(pdf, C.white);
    pdf.setFont(undefined, "bold").setFontSize(9);
    pdf.text(companyName.toUpperCase(), MARGINS.left, barH - 4.5);

    /* FACTURA badge */
    const badgeW = 26, badgeH = 7;
    const bX = pageW / 2 - badgeW / 2;
    const bY = (barH - badgeH) / 2;
    filledRect(pdf, bX, bY, badgeW, badgeH, C.greenDark, 1.5);
    setTxt(pdf, C.white);
    pdf.setFont(undefined, "bold").setFontSize(7.5);
    pdf.text("FACTURA", bX + badgeW / 2, bY + 5, { align: "center" });

    /* Doc number */
    pdf.setFont(undefined, "normal").setFontSize(8);
    pdf.text(`Nº ${nfNum} / ${nfYear}`, pageW - MARGINS.right, barH - 4.5, { align: "right" });

    /* Logo */
    if (logoPng) {
      const lW = 12, lH = 12;
      const lX = pageW - MARGINS.right - lW - 70;
      pdf.addImage(logoPng, "PNG", lX, (barH - lH) / 2, lW, lH);
    }

    /* Sub-bar */
    filledRect(pdf, 0, barH, pageW, 8, C.greenLight);
    setTxt(pdf, C.green);
    pdf.setFont(undefined, "normal").setFontSize(7.5);
    if (fechaES) pdf.text(`Fecha de emisión: ${fechaES}`, MARGINS.left, barH + 5.5);
    pdf.text("ORIGINAL — COPIA PARA EL CLIENTE", pageW - MARGINS.right, barH + 5.5, { align: "right" });

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

    /* Emisor */
    filledRect(pdf, MARGINS.left, y0, colW, cardH, C.slate50, 2);
    setDraw(pdf, C.green);
    pdf.setLineWidth(0.8);
    pdf.line(MARGINS.left, y0, MARGINS.left, y0 + cardH);

    setTxt(pdf, C.green);
    pdf.setFont(undefined, "bold").setFontSize(7);
    pdf.text("DATOS DEL EMISOR", MARGINS.left + 4, y0 + 6);

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

    /* Cliente */
    const cx = MARGINS.left + colW + 8;
    filledRect(pdf, cx, y0, colW, cardH, C.slate50, 2);
    setDraw(pdf, C.slate500);
    pdf.setLineWidth(0.8);
    pdf.line(cx, y0, cx, y0 + cardH);

    setTxt(pdf, C.slate500);
    pdf.setFont(undefined, "bold").setFontSize(7);
    pdf.text("FACTURADO A / CLIENTE", cx + 4, y0 + 6);

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

  /* ── COMMENTS ────────────────────────────────────────────────────────────── */
  function drawComments() {
    if (!comentarios?.trim()) return;
    ensureSpace(20);

    const { contentW } = box(pdf);

    filledRect(pdf, MARGINS.left, curY, contentW, 7, C.slate100, 1);
    setTxt(pdf, C.slate700);
    pdf.setFont(undefined, "bold").setFontSize(8);
    pdf.text("DESCRIPCIÓN / CONCEPTO", MARGINS.left + 4, curY + 5);
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

  /* ── TABLE ───────────────────────────────────────────────────────────────── */
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
      head: [["#", "Descripción del trabajo", "Cant.", "Und.", "P.Unit €", "IVA%", "IVA €", "Total €"]],
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
        fillColor: rgb(C.green), textColor: rgb(C.white),
        fontStyle: "bold", fontSize: 7.5,
        cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
      },
      alternateRowStyles: { fillColor: rgb(C.slate50) },
      columnStyles: {
        0: { cellWidth: fixed.idx,    halign: "center", fontStyle: "bold", textColor: rgb(C.green) },
        1: { cellWidth: descW },
        2: { cellWidth: fixed.cant,   halign: "center" },
        3: { cellWidth: fixed.und,    halign: "center", textColor: rgb(C.slate500), fontSize: 7.5 },
        4: { cellWidth: fixed.pUnit,  halign: "right",  fontStyle: "bold" },
        5: { cellWidth: fixed.ivaPct, halign: "center", textColor: rgb(C.slate500) },
        6: { cellWidth: fixed.ivaAmt, halign: "right",  textColor: rgb(C.slate500) },
        7: { cellWidth: fixed.total,  halign: "right",  fontStyle: "bold", textColor: rgb(C.green) },
      },
      rowPageBreak: "avoid",
      pageBreak:    "auto",
      didDrawPage:  () => { drawHeader(); drawFooter(); },
    });

    curY = (pdf.lastAutoTable?.finalY ?? startY) + 6;
  }

  /* ── TOTALS + PAYMENT ────────────────────────────────────────────────────── */
  function drawTotalsAndPayment() {
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

    setDraw(pdf, [50, 50, 70]);
    pdf.setLineWidth(0.3);
    pdf.line(boxX + 4, curY + 26, boxX + boxW - 4, curY + 26);

    filledRect(pdf, boxX, curY + 27, boxW, 11, C.green, 0);
    setTxt(pdf, C.white);
    pdf.setFont(undefined, "bold").setFontSize(8);
    pdf.text("TOTAL A PAGAR", boxX + 6, curY + 34);
    pdf.setFontSize(11);
    pdf.text(eur(totalFinal), boxX + boxW - 6, curY + 35, { align: "right" });

    /* Payment info (left side) */
    if (bank || accountNumber || holder) {
      ensureSpace(36);
      const payX  = MARGINS.left;
      const payW  = contentW - boxW - 8;
      const payH  = 38;
      const payY  = curY;

      filledRect(pdf, payX, payY, payW, payH, C.greenLight, 2);
      setDraw(pdf, C.green);
      pdf.setLineWidth(0.8);
      pdf.line(payX, payY, payX, payY + payH);

      setTxt(pdf, C.green);
      pdf.setFont(undefined, "bold").setFontSize(7);
      pdf.text("DATOS DE PAGO / TRANSFERENCIA BANCARIA", payX + 4, payY + 7, { charSpace: 0.3 });

      setTxt(pdf, C.slate700);
      pdf.setFont(undefined, "normal").setFontSize(8.5);
      const payLines = [
        holder        && `Titular:   ${holder}`,
        bank          && `Banco:     ${bank}`,
        accountNumber && `Cuenta:    ${accountNumber}`,
      ].filter(Boolean);
      pdf.text(payLines, payX + 4, payY + 15, { maxWidth: payW - 8, lineHeightFactor: 1.6 });
    }

    curY += 48;

    /* Signature area */
    ensureSpace(34);
    const sigBW = 74;
    const sigLX = MARGINS.left;
    const sigRX = pageW - MARGINS.right - sigBW;

    /* Client */
    filledRect(pdf, sigLX, curY, sigBW, 28, C.slate50, 2);
    setTxt(pdf, C.slate500);
    pdf.setFont(undefined, "bold").setFontSize(7);
    pdf.text("FIRMA DEL CLIENTE — CONFORME", sigLX + 4, curY + 6, { charSpace: 0.3 });
    setDraw(pdf, C.slate200);
    pdf.setLineWidth(0.3);
    pdf.line(sigLX + 4, curY + 23, sigLX + sigBW - 4, curY + 23);

    /* Company */
    filledRect(pdf, sigRX, curY, sigBW, 28, C.greenLight, 2);
    setTxt(pdf, C.green);
    pdf.setFont(undefined, "bold").setFontSize(7);
    pdf.text("FIRMA DE LA EMPRESA / SELLO", sigRX + 4, curY + 6, { charSpace: 0.3 });

    if (signaturePng) {
      const sW = 36, sH = 15;
      const sX = sigRX + (sigBW - sW) / 2;
      pdf.addImage(signaturePng, "PNG", sX, curY + 8, sW, sH);
    }
    setDraw(pdf, C.green);
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
  drawTotalsAndPayment();
  drawWatermarks();

  await savePDFFile(pdf, filename);
}

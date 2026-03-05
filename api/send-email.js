import { Resend } from "resend";
import PDFDocument from "pdfkit";

const resend = new Resend(process.env.RESEND_API_KEY);

// ── Génère le PDF des CGV ──────────────────────────────
function generateCGVPdf(cgvContent) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const lines = cgvContent.split("\n");

    lines.forEach((line) => {
      if (line.startsWith("# ")) {
        doc.moveDown(0.5)
          .fontSize(18).font("Helvetica-Bold")
          .text(line.replace("# ", ""), { align: "center" })
          .moveDown(0.5);
      } else if (line.startsWith("## ")) {
        doc.moveDown(0.5)
          .fontSize(12).font("Helvetica-Bold")
          .text(line.replace("## ", "").toUpperCase())
          .moveDown(0.3);
      } else if (line === "---") {
        doc.moveDown(0.3)
          .moveTo(50, doc.y).lineTo(545, doc.y).stroke()
          .moveDown(0.3);
      } else if (line.trim()) {
        const clean = line.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
        doc.fontSize(10).font("Helvetica").text(clean, { align: "justify" }).moveDown(0.2);
      } else {
        doc.moveDown(0.3);
      }
    });

    doc.end();
  });
}

// ── Génère le PDF de la facture ────────────────────────
function generateInvoicePdf(formData, paymentDate) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const invoiceNumber = `LEX-${Date.now().toString().slice(-8)}`;

    // En-tête
    doc.fontSize(24).font("Helvetica-Bold").text("LexGen", 50, 50);
    doc.fontSize(10).font("Helvetica").fillColor("#666")
      .text("Générateur de CGV professionnel", 50, 80)
      .text("contact@lexgen.fr", 50, 95)
      .text("lexgen.fr", 50, 110);

    doc.fillColor("#000")
      .fontSize(20).font("Helvetica-Bold")
      .text("FACTURE", 400, 50, { align: "right" });

    doc.fontSize(10).font("Helvetica")
      .text(`N° ${invoiceNumber}`, 400, 80, { align: "right" })
      .text(`Date : ${paymentDate}`, 400, 95, { align: "right" });

    // Ligne de séparation
    doc.moveDown(4)
      .moveTo(50, 145).lineTo(545, 145).stroke();

    // Infos client
    doc.fontSize(11).font("Helvetica-Bold").text("Facturé à :", 50, 160);
    doc.fontSize(10).font("Helvetica")
      .text(formData.companyName || "Client", 50, 178)
      .text(formData.legalForm || "", 50, 193)
      .text(`SIRET : ${formData.siret || ""}`, 50, 208)
      .text(formData.address || "", 50, 223)
      .text(formData.email || "", 50, 238);

    // Tableau
    doc.moveDown(5);
    const tableTop = 280;

    doc.fillColor("#1a1410").rect(50, tableTop, 495, 25).fill();
    doc.fillColor("#fff").fontSize(10).font("Helvetica-Bold")
      .text("Description", 60, tableTop + 8)
      .text("Qté", 380, tableTop + 8)
      .text("Prix HT", 420, tableTop + 8)
      .text("Total TTC", 470, tableTop + 8);

    doc.fillColor("#000").fontSize(10).font("Helvetica")
      .text("Génération CGV personnalisées", 60, tableTop + 35)
      .text("Conformes RGPD & Directive 2011/83/UE", 60, tableTop + 50, { width: 300 })
      .text("1", 385, tableTop + 35)
      .text("7,50 €", 420, tableTop + 35)
      .text("9,00 €", 470, tableTop + 35);

    doc.moveTo(50, tableTop + 75).lineTo(545, tableTop + 75).stroke();

    doc.fontSize(10)
      .text("Sous-total HT :", 380, tableTop + 85)
      .text("7,50 €", 470, tableTop + 85)
      .text("TVA (20%) :", 380, tableTop + 100)
      .text("1,50 €", 470, tableTop + 100);

    doc.font("Helvetica-Bold")
      .text("TOTAL TTC :", 380, tableTop + 120)
      .text("9,00 €", 470, tableTop + 120);

    // Mentions légales
    doc.fontSize(8).font("Helvetica").fillColor("#888")
      .text("Paiement effectué par carte bancaire via Stripe.", 50, 700)
      .text("TVA non applicable selon article 293 B du CGI si auto-entrepreneur, sinon TVA 20%.", 50, 715)
      .text(`LexGen — ${paymentDate} — Facture générée automatiquement`, 50, 730);

    doc.end();
  });
}

// ── Handler principal ──────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);

    const { formData, cgvContent } = body || {};

    if (!formData?.email) {
      return res.status(400).json({ error: "Email manquant" });
    }
    if (!cgvContent) {
      return res.status(400).json({ error: "Contenu CGV manquant" });
    }

    const paymentDate = new Date().toLocaleDateString("fr-FR");

    console.log(`📧 Envoi email à ${formData.email}...`);

    // Générer les PDFs
    const [cgvPdf, invoicePdf] = await Promise.all([
      generateCGVPdf(cgvContent),
      generateInvoicePdf(formData, paymentDate),
    ]);

    // Envoyer le mail
    const { data, error } = await resend.emails.send({
      from: "LexGen <noreply@lexgen.fr>",
      to: formData.email,
      subject: `✅ Vos CGV sont prêtes — ${formData.companyName}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1410;">
          <div style="background: #1a1410; padding: 24px 32px;">
            <h1 style="color: #f5f0e8; margin: 0; font-size: 24px;">Lex<span style="color: #d4b896;">Gen</span></h1>
          </div>
          <div style="padding: 32px;">
            <h2 style="font-size: 22px; margin-bottom: 8px;">Vos CGV sont prêtes ✅</h2>
            <p style="color: #4a4035; line-height: 1.7;">Bonjour,</p>
            <p style="color: #4a4035; line-height: 1.7;">
              Merci pour votre commande. Vous trouverez en pièces jointes :
            </p>
            <ul style="color: #4a4035; line-height: 2;">
              <li>📄 <strong>Vos CGV personnalisées</strong> pour <strong>${formData.companyName}</strong></li>
              <li>🧾 <strong>Votre facture</strong> de 9,00 €</li>
            </ul>
            <p style="color: #4a4035; line-height: 1.7;">
              Copiez-collez le contenu de vos CGV directement sur votre site.
            </p>
            <div style="background: #fdf6e3; border: 1px solid #e6d5a0; padding: 16px; border-radius: 4px; margin: 24px 0; font-size: 13px; color: #8a6914;">
              ⚠️ Ce document est fourni à titre informatif. Pour toute activité à risque élevé, nous recommandons une validation par un avocat.
            </div>
            <p style="color: #4a4035; font-size: 13px;">L'équipe LexGen</p>
          </div>
          <div style="background: #f5f0e8; border-top: 1px solid #e0d8c8; padding: 16px 32px; font-size: 11px; color: #888; text-align: center;">
            © ${new Date().getFullYear()} LexGen · lexgen.fr
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `CGV_${formData.companyName?.replace(/\s+/g, "_") || "LexGen"}.pdf`,
          content: cgvPdf,
        },
        {
          filename: `Facture_LexGen_${formData.companyName?.replace(/\s+/g, "_") || "Client"}.pdf`,
          content: invoicePdf,
        },
      ],
    });

    if (error) {
      console.error("Resend error:", error);
      return res.status(400).json({ error: error.message });
    }

    console.log(`✅ Email envoyé avec succès (id: ${data?.id})`);
    return res.status(200).json({ success: true, emailId: data?.id });

  } catch (err) {
    console.error("Send-email error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
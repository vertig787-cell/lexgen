import { Resend } from "resend";

function cgvToHtml(cgvContent) {
  const lines = cgvContent.split("\n");
  let html = "";
  for (const line of lines) {
    if (line.startsWith("# ")) {
      html += `<h1 style="font-family:Georgia,serif;font-size:22px;border-bottom:2px solid #1a1410;padding-bottom:8px;margin:0 0 20px">${line.slice(2)}</h1>`;
    } else if (line.startsWith("## ")) {
      html += `<h2 style="font-family:Georgia,serif;font-size:13px;text-transform:uppercase;letter-spacing:.05em;margin:24px 0 6px">${line.slice(3)}</h2>`;
    } else if (line === "---") {
      html += `<hr style="border:none;border-top:1px solid #ddd;margin:12px 0"/>`;
    } else if (line.trim()) {
      const formatted = line
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>");
      html += `<p style="font-size:13px;line-height:1.8;margin:0 0 8px;color:#1a1410">${formatted}</p>`;
    }
  }
  return html;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);

    const { formData, cgvContent } = body || {};

    if (!formData?.email) return res.status(400).json({ error: "Email manquant" });
    if (!cgvContent) return res.status(400).json({ error: "Contenu CGV manquant" });

    const { data, error } = await resend.emails.send({
      from: "LexGen <noreply@lexgen.fr>",
      to: formData.email,
      subject: `Vos CGV sont prêtes — ${formData.companyName}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:680px;margin:0 auto;color:#1a1410">
          <div style="background:#1a1410;padding:20px 32px">
            <span style="color:#f5f0e8;font-size:22px;font-weight:900">Lex<span style="color:#d4b896">Gen</span></span>
          </div>
          <div style="padding:32px">
            <h2 style="font-size:20px;margin:0 0 16px">Vos CGV sont prêtes ✅</h2>
            <p style="color:#4a4035;line-height:1.7;margin:0 0 12px">Bonjour,</p>
            <p style="color:#4a4035;line-height:1.7;margin:0 0 24px">
              Merci pour votre commande. Vous trouverez ci-dessous vos CGV personnalisées pour <strong>${formData.companyName}</strong>.
              Copiez-collez le contenu directement sur votre site.
            </p>
            <div style="background:#fafafa;border:1px solid #e0d8c8;padding:32px;margin:0 0 24px">
              ${cgvToHtml(cgvContent)}
            </div>
            <div style="background:#fdf6e3;border:1px solid #e6d5a0;padding:16px;font-size:12px;color:#8a6914">
              ⚠️ Ce document est fourni à titre informatif. Pour toute activité à risque élevé, nous recommandons une validation par un avocat.
            </div>
          </div>
          <div style="background:#f5f0e8;border-top:1px solid #e0d8c8;padding:16px 32px;font-size:11px;color:#888;text-align:center">
            © ${new Date().getFullYear()} LexGen · lexgen.fr
          </div>
        </div>
      `,
    });

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ success: true, emailId: data?.id });

  } catch (err) {
    console.error("send-email error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

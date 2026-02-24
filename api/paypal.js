export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { companyName } = req.body;

    // 1. Obtenir un token d'accès PayPal
    const authRes = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(
          process.env.PAYPAL_CLIENT_ID + ":" + process.env.PAYPAL_SECRET
        ).toString("base64"),
      },
      body: "grant_type=client_credentials",
    });
    const authData = await authRes.json();
    const accessToken = authData.access_token;

    // 2. Créer une commande PayPal
    const orderRes = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          amount: { currency_code: "EUR", value: "9.00" },
          description: `CGV LexGen — ${companyName || "Client"}`,
        }],
        application_context: {
          brand_name: "LexGen",
          locale: "fr-FR",
          user_action: "PAY_NOW",
          return_url: `${req.headers.origin}/success`,
          cancel_url: `${req.headers.origin}`,
        },
      }),
    });

    const orderData = await orderRes.json();
    const approvalUrl = orderData.links?.find(l => l.rel === "approve")?.href;

    if (!approvalUrl) {
      return res.status(400).json({ error: "Impossible de créer la commande PayPal." });
    }

    return res.status(200).json({ approvalUrl, orderId: orderData.id });

  } catch (err) {
    console.error("PayPal error:", err.message);
    return res.status(400).json({ error: err.message });
  }
}

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    // Parse body manuellement si nécessaire
    let body = req.body;
    if (typeof body === "string") {
      body = JSON.parse(body);
    }

    const { paymentMethodId, companyName } = body || {};

    if (!paymentMethodId) {
      console.error("Missing paymentMethodId, body received:", JSON.stringify(body));
      return res.status(400).json({ error: "Méthode de paiement manquante." });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: 900,
      currency: "eur",
      payment_method: paymentMethodId,
      payment_method_types: ["card"],
      confirm: false,
      description: `CGV LexGen — ${companyName || "Client"}`,
      metadata: { companyName: companyName || "" },
    });

    return res.status(200).json({ clientSecret: paymentIntent.client_secret });

  } catch (err) {
    console.error("Stripe error:", err.message);
    return res.status(400).json({ error: err.message });
  }
}

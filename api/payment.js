const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { cardNumber, expMonth, expYear, cvc, companyName } = req.body;

    // 1. Créer un token de carte
    const token = await stripe.tokens.create({
      card: {
        number: cardNumber,
        exp_month: expMonth,
        exp_year: expYear,
        cvc: cvc,
      },
    });

    // 2. Créer et confirmer le paiement
    const charge = await stripe.charges.create({
      amount: 900, // 9,00 € en centimes
      currency: "eur",
      source: token.id,
      description: `CGV LexGen — ${companyName || "Client"}`,
      metadata: { companyName: companyName || "" },
    });

    if (charge.status === "succeeded") {
      return res.status(200).json({ success: true, chargeId: charge.id });
    } else {
      return res.status(400).json({ error: "Paiement non confirmé." });
    }

  } catch (err) {
    console.error("Stripe error:", err.message);
    return res.status(400).json({ error: err.message });
  }
}

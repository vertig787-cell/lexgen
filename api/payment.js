import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { companyName, outputLanguage } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: {
            name: "Génération CGV LexGen",
            description: `CGV personnalisées pour ${companyName || "votre entreprise"} en ${outputLanguage || "Français"}`,
          },
          unit_amount: 900,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}&company=${encodeURIComponent(companyName || "")}`,
      cancel_url: `${req.headers.origin}`,
      metadata: { companyName: companyName || "", outputLanguage: outputLanguage || "Français" },
    });

    return res.status(200).json({ url: session.url });

  } catch (err) {
    console.error("Stripe error:", err.message);
    return res.status(400).json({ error: err.message });
  }
}

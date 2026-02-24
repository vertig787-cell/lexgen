import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { companyName } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: 900,
      currency: "eur",
      payment_method_types: ["card"],
      description: `CGV LexGen — ${companyName || "Client"}`,
      metadata: { companyName: companyName || "" },
    });

    return res.status(200).json({ clientSecret: paymentIntent.client_secret });

  } catch (err) {
    console.error("Stripe error:", err.message);
    return res.status(400).json({ error: err.message });
  }
}

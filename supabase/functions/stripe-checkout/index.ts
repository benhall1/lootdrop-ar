// Supabase Edge Function: stripe-checkout
// Handles Stripe Checkout session creation and product listing.
//
// POST / — Create a Checkout Session
// GET /products — List active products with prices

import Stripe from "npm:stripe@17";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-12-18.acacia" });

Deno.serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  const url = new URL(req.url);
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    // GET /products — List active products with prices
    if (req.method === "GET" && url.pathname.endsWith("/products")) {
      const products = await stripe.products.list({
        active: true,
        expand: ["data.default_price"],
      });

      const formatted = products.data.map((product) => {
        const defaultPrice = product.default_price as Stripe.Price | null;
        return {
          id: product.id,
          name: product.name,
          description: product.description,
          metadata: product.metadata,
          prices: defaultPrice
            ? [
                {
                  id: defaultPrice.id,
                  unit_amount: defaultPrice.unit_amount,
                  currency: defaultPrice.currency,
                  recurring: defaultPrice.recurring,
                  metadata: defaultPrice.metadata,
                },
              ]
            : [],
        };
      });

      return new Response(JSON.stringify({ data: formatted }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    // POST / — Create Checkout Session
    if (req.method === "POST") {
      const { userId, priceId, email, name, successUrl, cancelUrl } =
        await req.json();

      if (!priceId) {
        return new Response(
          JSON.stringify({ error: "priceId is required" }),
          { status: 400, headers: corsHeaders }
        );
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

      // Look up or create Stripe customer
      let customerId: string | undefined;

      if (userId) {
        const { data: user } = await supabase
          .from("users")
          .select("stripe_customer_id")
          .eq("id", userId)
          .single();

        if (user?.stripe_customer_id) {
          customerId = user.stripe_customer_id;
        } else {
          // Create new Stripe customer
          const customer = await stripe.customers.create({
            email: email || undefined,
            name: name || undefined,
            metadata: { supabase_user_id: userId },
          });
          customerId = customer.id;

          // Save to users table
          await supabase
            .from("users")
            .update({ stripe_customer_id: customerId })
            .eq("id", userId);
        }
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : email,
        line_items: [{ price: priceId, quantity: 1 }],
        mode: "subscription",
        success_url: successUrl || `${url.origin}/success`,
        cancel_url: cancelUrl || `${url.origin}/cancel`,
        metadata: { supabase_user_id: userId || "" },
      });

      return new Response(
        JSON.stringify({ url: session.url, sessionId: session.id }),
        { status: 200, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: corsHeaders }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: "Internal error", details: message }),
      { status: 500, headers: corsHeaders }
    );
  }
});

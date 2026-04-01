// Supabase Edge Function: stripe-webhook
// Handles Stripe webhook events for subscription lifecycle.
//
// Events handled:
// - checkout.session.completed → activate subscription
// - customer.subscription.updated → sync status
// - customer.subscription.deleted → deactivate
// - invoice.payment_failed → mark past_due

import Stripe from "npm:stripe@17";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-12-18.acacia" });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, Stripe-Signature",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
    });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response(JSON.stringify({ error: "Missing signature" }), {
      status: 400,
    });
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Webhook] Signature verification failed:", message);
    return new Response(
      JSON.stringify({ error: "Invalid signature" }),
      { status: 400 }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const userId = session.metadata?.supabase_user_id;

        if (userId) {
          await supabase
            .from("users")
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_status: "active",
              is_premium: true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);
        } else if (customerId) {
          // Fall back to matching by stripe_customer_id
          await supabase
            .from("users")
            .update({
              stripe_subscription_id: subscriptionId,
              subscription_status: "active",
              is_premium: true,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_customer_id", customerId);
        }

        console.log(`[Webhook] checkout.session.completed for user ${userId || customerId}`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status;

        await supabase
          .from("users")
          .update({
            subscription_status: status,
            is_premium: status === "active" || status === "trialing",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        console.log(`[Webhook] subscription.updated: ${status} for customer ${customerId}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await supabase
          .from("users")
          .update({
            subscription_status: "canceled",
            is_premium: false,
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        console.log(`[Webhook] subscription.deleted for customer ${customerId}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await supabase
          .from("users")
          .update({
            subscription_status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        console.log(`[Webhook] invoice.payment_failed for customer ${customerId}`);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Webhook] Processing error:", message);
    return new Response(
      JSON.stringify({ error: "Processing failed", details: message }),
      { status: 500 }
    );
  }
});

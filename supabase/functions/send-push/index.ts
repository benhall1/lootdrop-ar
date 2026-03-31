// Supabase Edge Function: send-push
// Sends Web Push notifications to subscribed users via VAPID-signed requests.
//
// POST body: { type, title, body, userId?, data? }
// - type: "nearby-loot" | "daily-reminder" | "claim-congrats" | "broadcast"
// - userId: target specific user (optional — if omitted, sends to all subscribers)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = "mailto:hello@lootdrop.app";

// --- VAPID JWT signing using Web Crypto API ---

function base64UrlEncode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (str.length % 4)) % 4);
  const binary = atob(str + padding);
  return new Uint8Array([...binary].map((c) => c.charCodeAt(0)));
}

async function importVapidPrivateKey(
  base64Key: string
): Promise<CryptoKey> {
  const rawKey = base64UrlDecode(base64Key);
  return crypto.subtle.importKey(
    "jwk",
    {
      kty: "EC",
      crv: "P-256",
      d: base64Key,
      x: base64UrlEncode(base64UrlDecode(VAPID_PUBLIC_KEY).slice(1, 33)),
      y: base64UrlEncode(base64UrlDecode(VAPID_PUBLIC_KEY).slice(33, 65)),
    },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
}

async function createVapidJwt(audience: string): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 3600, // 12 hours
    sub: VAPID_SUBJECT,
  };

  const encodedHeader = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify(header))
  );
  const encodedPayload = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify(payload))
  );
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const key = await importVapidPrivateKey(VAPID_PRIVATE_KEY);
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert DER signature to raw r||s (64 bytes)
  const sigBytes = new Uint8Array(signature);
  let r: Uint8Array, s: Uint8Array;

  if (sigBytes.length === 64) {
    r = sigBytes.slice(0, 32);
    s = sigBytes.slice(32, 64);
  } else {
    // DER-encoded: parse
    let offset = 2; // skip 0x30, length
    if (sigBytes[offset] === 0x02) {
      offset++;
      const rLen = sigBytes[offset++];
      const rRaw = sigBytes.slice(offset, offset + rLen);
      r = rRaw.length > 32 ? rRaw.slice(rRaw.length - 32) : rRaw;
      if (r.length < 32) {
        const padded = new Uint8Array(32);
        padded.set(r, 32 - r.length);
        r = padded;
      }
      offset += rLen;
      offset++; // skip 0x02
      const sLen = sigBytes[offset++];
      const sRaw = sigBytes.slice(offset, offset + sLen);
      s = sRaw.length > 32 ? sRaw.slice(sRaw.length - 32) : sRaw;
      if (s.length < 32) {
        const padded = new Uint8Array(32);
        padded.set(s, 32 - s.length);
        s = padded;
      }
    } else {
      r = sigBytes.slice(0, 32);
      s = sigBytes.slice(32, 64);
    }
  }

  const rawSig = new Uint8Array(64);
  rawSig.set(r, 0);
  rawSig.set(s, 32);

  return `${unsignedToken}.${base64UrlEncode(rawSig)}`;
}

// --- Send push to a single subscription ---

async function sendPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: object
): Promise<{ success: boolean; endpoint: string; error?: string }> {
  try {
    const url = new URL(subscription.endpoint);
    const audience = `${url.protocol}//${url.host}`;
    const jwt = await createVapidJwt(audience);

    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        TTL: "86400",
        Authorization: `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
        Urgency: "normal",
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 201 || response.status === 200) {
      return { success: true, endpoint: subscription.endpoint };
    }

    // 404 or 410 = subscription expired, should be cleaned up
    if (response.status === 404 || response.status === 410) {
      return {
        success: false,
        endpoint: subscription.endpoint,
        error: "expired",
      };
    }

    const text = await response.text();
    return {
      success: false,
      endpoint: subscription.endpoint,
      error: `${response.status}: ${text}`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      endpoint: subscription.endpoint,
      error: message,
    };
  }
}

// --- Main handler ---

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
    });
  }

  try {
    const { type, title, body, userId, data } = await req.json();

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: "title and body are required" }),
        { status: 400 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Query subscriptions
    let query = supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth");

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: subscriptions, error: queryError } = await query;

    if (queryError) {
      return new Response(
        JSON.stringify({ error: "Failed to query subscriptions", details: queryError }),
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, failed: 0, message: "No subscribers" }),
        { status: 200 }
      );
    }

    // Build notification payload
    const payload = {
      title,
      body,
      icon: "/assets/images/icon.png",
      badge: "/assets/images/favicon.png",
      tag: `lootdrop-${type || "general"}`,
      data: { url: "/", ...data },
    };

    // Send to all subscriptions in parallel
    const results = await Promise.allSettled(
      subscriptions.map((sub) => sendPush(sub, payload))
    );

    let sent = 0;
    let failed = 0;
    const expiredEndpoints: string[] = [];

    for (const result of results) {
      if (result.status === "fulfilled" && result.value.success) {
        sent++;
      } else {
        failed++;
        if (
          result.status === "fulfilled" &&
          result.value.error === "expired"
        ) {
          expiredEndpoints.push(result.value.endpoint);
        }
      }
    }

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", expiredEndpoints);
    }

    return new Response(
      JSON.stringify({
        sent,
        failed,
        cleaned: expiredEndpoints.length,
        total: subscriptions.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: "Internal error", details: message }),
      { status: 500 }
    );
  }
});

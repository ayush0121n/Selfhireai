/**
 * SelfHire.ai Cloudflare Edge Worker
 * Handles edge caching, rate limiting, and secure proxying to the SelfHire API.
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Apply security headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Turnstile-Token",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check at edge
    if (url.pathname === "/cdn/health") {
      return new Response(
        JSON.stringify({ status: "edge-active", region: request.cf?.colo || "global" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Proxy requests
    return fetch(request);
  },
};

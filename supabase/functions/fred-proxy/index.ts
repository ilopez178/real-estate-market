import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const FRED_BASE = "https://api.stlouisfed.org/fred/series/observations";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  const FRED_API_KEY = Deno.env.get("FRED_API_KEY");
  if (!FRED_API_KEY) {
    return new Response(
      JSON.stringify({ error: "FRED API key not configured on server" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }

  const url = new URL(req.url);
  const params = new URLSearchParams();
  for (const [key, value] of url.searchParams) {
    if (key !== "api_key") params.set(key, value);
  }
  params.set("api_key", FRED_API_KEY);

  try {
    const fredRes = await fetch(`${FRED_BASE}?${params}`, {
      headers: { Accept: "application/json" },
    });
    const data = await fredRes.json();

    return new Response(JSON.stringify(data), {
      status: fredRes.status,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }
});

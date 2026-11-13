type Env = {
  ODDS_API_KEY: string;
  ASSETS: Fetcher;
};

const ODDS_BASE = "https://api.the-odds-api.com/v4";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      return handleApi(request, url, env);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleApi(
  request: Request,
  url: URL,
  env: Env
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() });
  }

  if (!env.ODDS_API_KEY) {
    return json(
      { message: "ODDS_API_KEY is not configured on the Worker." },
      500
    );
  }

  if (url.pathname === "/api/sports") {
    const upstream = await fetch(
      `${ODDS_BASE}/sports/?apiKey=${encodeURIComponent(env.ODDS_API_KEY)}`
    );
    return proxyJson(upstream);
  }

  const oddsMatch = url.pathname.match(/^\/api\/odds\/([^/]+)$/);
  if (oddsMatch) {
    const sport = decodeURIComponent(oddsMatch[1]);
    const params = new URLSearchParams({
      apiKey: env.ODDS_API_KEY,
      regions: url.searchParams.get("regions") ?? "us,us2,eu",
      markets: url.searchParams.get("markets") ?? "h2h,spreads,totals",
      oddsFormat: url.searchParams.get("oddsFormat") ?? "decimal",
    });
    const upstream = await fetch(
      `${ODDS_BASE}/sports/${encodeURIComponent(sport)}/odds?${params}`
    );
    return proxyJson(upstream);
  }

  return json({ message: "Not found" }, 404);
}

async function proxyJson(upstream: Response): Promise<Response> {
  const body = await upstream.text();
  const headers = corsHeaders({
    "Content-Type": "application/json",
    "x-requests-remaining": upstream.headers.get("x-requests-remaining") ?? "",
    "x-requests-used": upstream.headers.get("x-requests-used") ?? "",
  });
  return new Response(body, { status: upstream.status, headers });
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders({ "Content-Type": "application/json" }),
  });
}

function corsHeaders(extra: Record<string, string> = {}): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    ...extra,
  };
}

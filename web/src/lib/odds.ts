export type Outcome = {
  name: string;
  price: number;
  point?: number;
  description?: string;
};

export type Market = {
  key: string;
  last_update: string;
  outcomes: Outcome[];
};

export type Bookmaker = {
  key: string;
  title: string;
  last_update: string;
  markets: Market[];
};

export type EventOdds = {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
};

export type Sport = {
  key: string;
  group: string;
  title: string;
  description: string;
  active: boolean;
  has_outrights: boolean;
};

const ODDS_BASE = "https://api.the-odds-api.com/v4";

export function americanToDecimal(american: number): number {
  if (american > 0) return 1 + american / 100;
  return 1 + 100 / Math.abs(american);
}

export function decimalToAmerican(decimal: number): number {
  if (decimal >= 2) return Math.round((decimal - 1) * 100);
  return Math.round(-100 / (decimal - 1));
}

export function impliedProb(decimalOdds: number): number {
  return 1 / decimalOdds;
}

/** Remove equal vig from a 2- or 3-way market. */
export function noVigProbs(decimals: number[]): number[] {
  const raw = decimals.map(impliedProb);
  const sum = raw.reduce((a, b) => a + b, 0);
  if (sum <= 0) return raw;
  return raw.map((p) => p / sum);
}

export async function fetchSports(apiKey: string): Promise<Sport[]> {
  const res = await fetch(`${ODDS_BASE}/sports/?apiKey=${encodeURIComponent(apiKey)}`);
  if (!res.ok) throw new Error(await errorText(res));
  return res.json();
}

export async function fetchOdds(opts: {
  apiKey: string;
  sport: string;
  regions?: string;
  markets?: string;
  oddsFormat?: "decimal" | "american";
}): Promise<{ events: EventOdds[]; remaining?: string; used?: string }> {
  const params = new URLSearchParams({
    apiKey: opts.apiKey,
    regions: opts.regions ?? "us,us2,eu",
    markets: opts.markets ?? "h2h,spreads,totals",
    oddsFormat: opts.oddsFormat ?? "decimal",
  });
  const res = await fetch(
    `${ODDS_BASE}/sports/${encodeURIComponent(opts.sport)}/odds?${params}`
  );
  if (!res.ok) throw new Error(await errorText(res));
  const events = (await res.json()) as EventOdds[];
  return {
    events,
    remaining: res.headers.get("x-requests-remaining") ?? undefined,
    used: res.headers.get("x-requests-used") ?? undefined,
  };
}

async function errorText(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body?.message || body?.error_code || `${res.status} ${res.statusText}`;
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}

export const SPORT_PRESETS = [
  { key: "upcoming", label: "Upcoming (all)" },
  { key: "americanfootball_nfl", label: "NFL" },
  { key: "basketball_nba", label: "NBA" },
  { key: "baseball_mlb", label: "MLB" },
  { key: "icehockey_nhl", label: "NHL" },
  { key: "americanfootball_ncaaf", label: "NCAAF" },
  { key: "basketball_ncaab", label: "NCAAB" },
  { key: "soccer_epl", label: "EPL" },
  { key: "soccer_usa_mls", label: "MLS" },
] as const;

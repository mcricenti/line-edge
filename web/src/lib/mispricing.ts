import {
  EventOdds,
  Bookmaker,
  Market,
  impliedProb,
  noVigProbs,
} from "./odds";

export type Opportunity = {
  id: string;
  type: "arbitrage" | "sharp-gap" | "best-price";
  strategyId: string;
  title: string;
  detail: string;
  event: string;
  commence: string;
  sport: string;
  market: string;
  edgePct: number;
  legs: { book: string; outcome: string; price: number; point?: number }[];
};

const SHARP_KEYS = new Set(["pinnacle", "betfair_ex_eu", "betfair_ex_uk", "matchbook"]);

function marketByKey(book: Bookmaker, key: string): Market | undefined {
  return book.markets.find((m) => m.key === key);
}

function outcomeKey(name: string, point?: number): string {
  return point === undefined ? name : `${name}|${point}`;
}

/** 2-way / 3-way arb across books for a market key. */
export function findArbitrage(event: EventOdds, marketKey: string): Opportunity[] {
  const priceMap = new Map<string, { book: string; price: number; point?: number; name: string }>();

  for (const book of event.bookmakers) {
    const market = marketByKey(book, marketKey);
    if (!market) continue;
    for (const o of market.outcomes) {
      if (marketKey === "h2h" && o.name.toLowerCase().includes("draw") === false && market.outcomes.length > 3) {
        // ignore exotic
      }
      const key = outcomeKey(o.name, o.point);
      const prev = priceMap.get(key);
      if (!prev || o.price > prev.price) {
        priceMap.set(key, {
          book: book.title,
          price: o.price,
          point: o.point,
          name: o.name,
        });
      }
    }
  }

  // Group by point line for spreads/totals
  const byLine = new Map<string, typeof priceMap>();
  for (const [key, val] of priceMap) {
    const line =
      val.point === undefined ? "__ml__" : String(Math.abs(val.point));
    if (!byLine.has(line)) byLine.set(line, new Map());
    byLine.get(line)!.set(key, val);
  }

  const out: Opportunity[] = [];
  for (const [, map] of byLine) {
    const legs = [...map.values()];
    if (legs.length < 2) continue;
    // For a given absolute point, we need complementary sides
    const invSum = legs.reduce((s, l) => s + 1 / l.price, 0);
    if (invSum < 0.995) {
      const edgePct = (1 - invSum) * 100;
      out.push({
        id: `${event.id}-${marketKey}-arb-${legs.map((l) => l.name).join("-")}`,
        type: "arbitrage",
        strategyId: "arbitrage",
        title: `Arb ${edgePct.toFixed(2)}% · ${marketKey}`,
        detail: `Combined implied ${ (invSum * 100).toFixed(2)}% across books.`,
        event: `${event.away_team} @ ${event.home_team}`,
        commence: event.commence_time,
        sport: event.sport_title,
        market: marketKey,
        edgePct,
        legs: legs.map((l) => ({
          book: l.book,
          outcome: l.name,
          price: l.price,
          point: l.point,
        })),
      });
    }
  }
  return out;
}

/** Soft books offering better than sharp no-vig fair price. */
export function findSharpGaps(event: EventOdds, marketKey = "h2h"): Opportunity[] {
  const sharp = event.bookmakers.find((b) => SHARP_KEYS.has(b.key));
  if (!sharp) return [];
  const sharpMarket = marketByKey(sharp, marketKey);
  if (!sharpMarket || sharpMarket.outcomes.length < 2) return [];

  const sharpOutcomes = sharpMarket.outcomes.filter((o) =>
    marketKey === "h2h" ? true : o.point !== undefined
  );
  // Use main ML only for h2h (no points)
  const mlOutcomes =
    marketKey === "h2h"
      ? sharpOutcomes.filter((o) => o.point === undefined)
      : sharpOutcomes;

  if (mlOutcomes.length < 2) return [];

  // Pair by shared absolute point for spreads/totals
  const lines = new Map<number | "ml", typeof mlOutcomes>();
  for (const o of mlOutcomes) {
    const k = o.point === undefined ? "ml" : Math.abs(o.point);
    if (!lines.has(k as number | "ml")) lines.set(k as number | "ml", []);
    lines.get(k as number | "ml")!.push(o);
  }

  const opportunities: Opportunity[] = [];

  for (const [, outs] of lines) {
    if (outs.length < 2) continue;
    const fair = noVigProbs(outs.map((o) => o.price));
    const fairByName = new Map(outs.map((o, i) => [o.name, fair[i]]));

    for (const book of event.bookmakers) {
      if (SHARP_KEYS.has(book.key)) continue;
      const m = marketByKey(book, marketKey);
      if (!m) continue;
      for (const o of m.outcomes) {
        if (marketKey !== "h2h" && outs[0].point !== undefined) {
          if (o.point === undefined) continue;
          // same absolute line
          if (Math.abs(o.point) !== Math.abs(outs[0].point!)) continue;
        }
        const fairP = fairByName.get(o.name);
        if (fairP === undefined) continue;
        const marketP = impliedProb(o.price);
        const edge = fairP - marketP;
        // Require at least ~1.5% edge vs sharp fair
        if (edge >= 0.015) {
          opportunities.push({
            id: `${event.id}-${marketKey}-gap-${book.key}-${o.name}-${o.point ?? "ml"}`,
            type: "sharp-gap",
            strategyId: "soft-vs-sharp",
            title: `+${(edge * 100).toFixed(1)}¢ vs sharp · ${o.name}`,
            detail: `${book.title} ${o.price.toFixed(3)} vs ${sharp.title} fair ${(fairP * 100).toFixed(1)}% (mkt ${(marketP * 100).toFixed(1)}%).`,
            event: `${event.away_team} @ ${event.home_team}`,
            commence: event.commence_time,
            sport: event.sport_title,
            market: marketKey,
            edgePct: edge * 100,
            legs: [
              {
                book: book.title,
                outcome: o.name,
                price: o.price,
                point: o.point,
              },
              {
                book: `${sharp.title} (ref)`,
                outcome: o.name,
                price: outs.find((x) => x.name === o.name)?.price ?? 0,
                point: o.point,
              },
            ],
          });
        }
      }
    }
  }

  return opportunities;
}

/** Best available price vs median book — line shopping value. */
export function findBestPriceEdges(event: EventOdds, marketKey = "h2h"): Opportunity[] {
  const byOutcome = new Map<
    string,
    { name: string; point?: number; prices: { book: string; price: number }[] }
  >();

  for (const book of event.bookmakers) {
    const m = marketByKey(book, marketKey);
    if (!m) continue;
    for (const o of m.outcomes) {
      if (marketKey === "h2h" && o.point !== undefined) continue;
      const key = outcomeKey(o.name, o.point);
      if (!byOutcome.has(key)) {
        byOutcome.set(key, { name: o.name, point: o.point, prices: [] });
      }
      byOutcome.get(key)!.prices.push({ book: book.title, price: o.price });
    }
  }

  const out: Opportunity[] = [];
  for (const [, row] of byOutcome) {
    if (row.prices.length < 3) continue;
    const sorted = [...row.prices].sort((a, b) => a.price - b.price);
    const median = sorted[Math.floor(sorted.length / 2)].price;
    const best = sorted[sorted.length - 1];
    const edge = impliedProb(median) - impliedProb(best.price);
    if (edge >= 0.01) {
      out.push({
        id: `${event.id}-${marketKey}-best-${row.name}-${row.point ?? "ml"}`,
        type: "best-price",
        strategyId: "line-shopping",
        title: `Best price +${(edge * 100).toFixed(1)}¢ · ${row.name}`,
        detail: `${best.book} ${best.price.toFixed(3)} vs median ${median.toFixed(3)} (${row.prices.length} books).`,
        event: `${event.away_team} @ ${event.home_team}`,
        commence: event.commence_time,
        sport: event.sport_title,
        market: marketKey,
        edgePct: edge * 100,
        legs: [
          { book: best.book, outcome: row.name, price: best.price, point: row.point },
        ],
      });
    }
  }
  return out;
}

export function scanEvent(event: EventOdds): Opportunity[] {
  const markets = ["h2h", "spreads", "totals"] as const;
  const found: Opportunity[] = [];
  for (const m of markets) {
    found.push(...findArbitrage(event, m));
    found.push(...findSharpGaps(event, m));
    found.push(...findBestPriceEdges(event, m));
  }
  // de-dupe by id
  const map = new Map(found.map((o) => [o.id, o]));
  return [...map.values()].sort((a, b) => b.edgePct - a.edgePct);
}

export function scanAll(events: EventOdds[]): Opportunity[] {
  return events.flatMap(scanEvent).sort((a, b) => b.edgePct - a.edgePct);
}

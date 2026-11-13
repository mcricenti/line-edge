export type Strategy = {
  id: string;
  name: string;
  summary: string;
  edgeType: "market-structure" | "model" | "behavioral" | "staking" | "process";
  liveDetectable: boolean;
  sources: string[];
  howItWorks: string[];
  caveats: string;
};

export const strategies: Strategy[] = [
  {
    id: "line-shopping",
    name: "Line shopping / juice-free price",
    summary:
      "The same side often has different prices across books. Taking the best number is the simplest durable edge.",
    edgeType: "market-structure",
    liveDetectable: true,
    sources: ["Sharper (Pokerjoe)", "The Logic of Sports Betting (Miller & Davidow)"],
    howItWorks: [
      "Pull the same market from multiple sportsbooks.",
      "Convert prices to implied probability (remove juice where possible).",
      "Bet only at the best available price relative to consensus.",
    ],
    caveats: "Limits and geo-availability matter; best price may be on a soft book that restricts winners.",
  },
  {
    id: "soft-vs-sharp",
    name: "Soft book vs sharp (Pinnacle) gap",
    summary:
      "When a soft book lags Pinnacle (or another sharp market), the gap is a candidate mispricing until books converge.",
    edgeType: "market-structure",
    liveDetectable: true,
    sources: ["Sharper", "Fixed Odds Sports Betting (Buchdahl)", "Logic of Sports Betting"],
    howItWorks: [
      "Treat Pinnacle (or exchange) as a sharp reference line.",
      "Flag soft-book prices that imply a meaningfully worse number for the book / better for the bettor.",
      "Prefer sides where soft books are slower to move after sharp steam.",
    ],
    caveats: "Pinnacle public odds can be delayed; gaps can close in seconds. Not every gap is bettable size.",
  },
  {
    id: "arbitrage",
    name: "Cross-book arbitrage",
    summary:
      "If opposing outcomes across books imply a combined probability under 100%, a locked profit exists before fees/limits.",
    edgeType: "market-structure",
    liveDetectable: true,
    sources: ["Vlastakis et al. (2009)", "Sharper (middles/scalps)", "Buchdahl"],
    howItWorks: [
      "For 2-way markets: find max decimal odds on each side across books.",
      "If 1/o1 + 1/o2 < 1, stake proportionally for risk-free return.",
      "For 3-way soccer, include the draw the same way.",
    ],
    caveats: "Rare, short-lived, often low ROI after latency, account risk, and void rules. Good as a scanner, not a career.",
  },
  {
    id: "clv",
    name: "Beat the closing line (CLV)",
    summary:
      "Consistently getting a better price than the close is the main empirical skill test for sharp bettors.",
    edgeType: "process",
    liveDetectable: false,
    sources: ["Sharper", "Buchdahl", "Miller & Davidow"],
    howItWorks: [
      "Record your bet price and the closing price at the same book or a sharp reference.",
      "Measure average closing-line value over large samples.",
      "Use CLV as the primary KPI before short-term win rate.",
    ],
    caveats: "Needs historical closes and bet logging; live scanner shows current gaps, not your personal CLV.",
  },
  {
    id: "derivative-lag",
    name: "Derivative / correlated market lag",
    summary:
      "Main-market moves often leave first-half, team totals, and props behind. Attack the unmoved correlated market.",
    edgeType: "market-structure",
    liveDetectable: false,
    sources: ["The Logic of Sports Betting (Miller & Davidow)", "Haralabos Voulgaris NBA totals lore"],
    howItWorks: [
      "Watch steam on spread/total/moneyline.",
      "Check whether halves, team totals, and related props moved with the information.",
      "Bet the lagged market when the causal link is clear.",
    ],
    caveats: "Requires multi-market feeds beyond basic h2h/spreads/totals. Books have gotten faster since early NBA half-total edges.",
  },
  {
    id: "alt-lines",
    name: "Alternate lines & point buying",
    summary:
      "Alt spreads/totals are often mispriced relative to the main line’s no-vig fair number and push frequencies.",
    edgeType: "market-structure",
    liveDetectable: false,
    sources: ["Sharper", "Sharp Sports Betting (Wong)", "Weighing the Odds (King Yao)"],
    howItWorks: [
      "Build a juice-free main line.",
      "Price alt lines from a distribution around that fair number.",
      "Buy/sell points only when the book’s price is softer than the distribution implies.",
    ],
    caveats: "Needs a distributional model; naive point buying usually loses juice.",
  },
  {
    id: "model-vs-market",
    name: "Projection model vs market price",
    summary:
      "Independent win probabilities (baseball projections, Dixon–Coles soccer, etc.) beat the market only when edge clears juice.",
    edgeType: "model",
    liveDetectable: false,
    sources: [
      "Trading Bases (Joe Peta)",
      "Dixon & Coles (1997)",
      "Mathletics (Winston)",
      "Calculated Bets (Skiena)",
      "Mallios adaptive drift",
    ],
    howItWorks: [
      "Estimate true probabilities with a sport-specific model.",
      "Compare to market-implied probabilities after removing vig.",
      "Bet only when edge exceeds a hurdle that survives juice and estimation error.",
    ],
    caveats: "Most published ‘edges’ fail out-of-sample after data mining (Vandenbruaene et al. 2022).",
  },
  {
    id: "favorite-longshot",
    name: "Favorite–longshot structure",
    summary:
      "Racetrack and some fixed-odds markets overbet longshots; favorites can have higher expected returns—but often not enough after juice.",
    edgeType: "behavioral",
    liveDetectable: true,
    sources: ["Thaler & Ziemba (1988)", "Sauer (1998)", "Snowberg & Wolfers", "Handbook of Sports and Lottery Markets"],
    howItWorks: [
      "Map odds buckets to realized win rates over history.",
      "Prefer favorites when longshot bias is large enough to clear the vig.",
      "Re-check by sport—soccer two-way favorites differ from multi-horse fields.",
    ],
    caveats: "Bias is well documented; profitable exploitation after costs is much rarer and often non-persistent.",
  },
  {
    id: "kelly",
    name: "Kelly / fractional Kelly staking",
    summary:
      "Once you have a quantified edge, stake sizing determines whether you compound or blow up.",
    edgeType: "staking",
    liveDetectable: false,
    sources: ["Fortune’s Formula", "Sharper", "Missing Billionaires (Haghani)", "Barge-Gil staking paper"],
    howItWorks: [
      "Estimate edge = your_prob ? implied_prob.",
      "Full Kelly stake ? edge / odds_decimal_net (or classic Kelly formula).",
      "Use half/quarter Kelly under uncertainty.",
    ],
    caveats: "Overestimating edge with full Kelly is ruinous. Fractional Kelly is the practical default.",
  },
  {
    id: "calibration",
    name: "Forecast calibration & decision hygiene",
    summary:
      "Edge compounds only if probabilities are calibrated and bets are treated as EV decisions, not narratives.",
    edgeType: "process",
    liveDetectable: false,
    sources: ["Superforecasting (Tetlock)", "Thinking in Bets (Duke)", "Success Equation (Mauboussin)"],
    howItWorks: [
      "Keep a probability journal with base rates.",
      "Score calibration (Brier) separately from P&L.",
      "Skip markets where skill cannot overcome variance + juice.",
    ],
    caveats: "Process edge is slow and invisible day-to-day; it is the filter that keeps models honest.",
  },
];

export const edgeTypeLabel: Record<Strategy["edgeType"], string> = {
  "market-structure": "Market structure",
  model: "Modeling",
  behavioral: "Behavioral",
  staking: "Bankroll",
  process: "Process",
};

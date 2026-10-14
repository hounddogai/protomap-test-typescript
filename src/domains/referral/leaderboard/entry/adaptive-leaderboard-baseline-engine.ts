import { AdaptiveLeaderboardBaseline } from "./adaptive-leaderboard-baseline.js";

/** One step of the adaptive leaderboard baseline calculation. */
export interface AdaptiveLeaderboardBaselineStep {
  describe(): string;
  adjust(item: AdaptiveLeaderboardBaseline, value: number): number;
}

export class PercentAdaptiveLeaderboardBaselineAdjuster implements AdaptiveLeaderboardBaselineStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveLeaderboardBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapAdaptiveLeaderboardBaselineAdjuster implements AdaptiveLeaderboardBaselineStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveLeaderboardBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredAdaptiveLeaderboardBaselineAdjuster implements AdaptiveLeaderboardBaselineStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveLeaderboardBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the adaptive leaderboard baseline steps in order and keeps a trace of each. */
export class AdaptiveLeaderboardBaselineEngine {
  steps: AdaptiveLeaderboardBaselineStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveLeaderboardBaselineStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: AdaptiveLeaderboardBaseline): number {
    let current = item.weightedValue();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: AdaptiveLeaderboardBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultAdaptiveLeaderboardBaselineEngine(): AdaptiveLeaderboardBaselineEngine {
  return new AdaptiveLeaderboardBaselineEngine(
    [
      new PercentAdaptiveLeaderboardBaselineAdjuster(-13.7),
      new CapAdaptiveLeaderboardBaselineAdjuster(40384),
      new TieredAdaptiveLeaderboardBaselineAdjuster([970, 9096], [0.92, 0.85]),
    ],
    [],
    0.5,
    40681,
  );
}

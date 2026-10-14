import * as numbers from "../../../../kit/numbers.js";
import { StrictLeaderboardAgreement } from "./strict-leaderboard-agreement.js";

/** One step of the strict leaderboard agreement calculation. */
export interface StrictLeaderboardAgreementFactor {
  describe(): string;
  adjust(item: StrictLeaderboardAgreement, value: number): number;
}

export class CapStrictLeaderboardAgreementAdjuster implements StrictLeaderboardAgreementFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictLeaderboardAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LabelStrictLeaderboardAgreementAdjuster implements StrictLeaderboardAgreementFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: StrictLeaderboardAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumStrictLeaderboardAgreementAdjuster implements StrictLeaderboardAgreementFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictLeaderboardAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class StrictLeaderboardAgreementExpiresAtOffsetAdjuster implements StrictLeaderboardAgreementFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: StrictLeaderboardAgreement, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class PercentStrictLeaderboardAgreementAdjuster implements StrictLeaderboardAgreementFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictLeaderboardAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredStrictLeaderboardAgreementAdjuster implements StrictLeaderboardAgreementFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictLeaderboardAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the strict leaderboard agreement steps in order and keeps a trace of each. */
export class StrictLeaderboardAgreementEngine {
  steps: StrictLeaderboardAgreementFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictLeaderboardAgreementFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictLeaderboardAgreement): number {
    let current = item.projectedVolume();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: StrictLeaderboardAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictLeaderboardAgreementEngine(): StrictLeaderboardAgreementEngine {
  return new StrictLeaderboardAgreementEngine(
    [
      new CapStrictLeaderboardAgreementAdjuster(42525),
      new LabelStrictLeaderboardAgreementAdjuster(new Map<string, number>([["north", 1.2]])),
      new MinimumStrictLeaderboardAgreementAdjuster(6.6),
      new StrictLeaderboardAgreementExpiresAtOffsetAdjuster(1.96),
      new PercentStrictLeaderboardAgreementAdjuster(6.8),
      new TieredStrictLeaderboardAgreementAdjuster([2805, 5432], [0.87, 1.19]),
    ],
    [],
    0.8,
    99499.9,
  );
}

import * as numbers from "../../../../kit/numbers.js";
import { SeasonalFraudCheckClaim } from "./seasonal-fraud-check-claim.js";

/** One step of the seasonal fraud check claim calculation. */
export interface SeasonalFraudCheckClaimModifier {
  describe(): string;
  adjust(item: SeasonalFraudCheckClaim, value: number): number;
}

export class CapSeasonalFraudCheckClaimAdjuster implements SeasonalFraudCheckClaimModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalFraudCheckClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumSeasonalFraudCheckClaimAdjuster implements SeasonalFraudCheckClaimModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalFraudCheckClaim, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CategorySeasonalFraudCheckClaimAdjuster implements SeasonalFraudCheckClaimModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: SeasonalFraudCheckClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredSeasonalFraudCheckClaimAdjuster implements SeasonalFraudCheckClaimModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalFraudCheckClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SeasonalFraudCheckClaimEndsAtOffsetAdjuster implements SeasonalFraudCheckClaimModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: SeasonalFraudCheckClaim, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class PercentSeasonalFraudCheckClaimAdjuster implements SeasonalFraudCheckClaimModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalFraudCheckClaim, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the seasonal fraud check claim steps in order and keeps a trace of each. */
export class SeasonalFraudCheckClaimEngine {
  steps: SeasonalFraudCheckClaimModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalFraudCheckClaimModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SeasonalFraudCheckClaim): number {
    let current = item.netValue();
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

  evaluateAll(items: SeasonalFraudCheckClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSeasonalFraudCheckClaimEngine(): SeasonalFraudCheckClaimEngine {
  return new SeasonalFraudCheckClaimEngine(
    [
      new CapSeasonalFraudCheckClaimAdjuster(28847),
      new MinimumSeasonalFraudCheckClaimAdjuster(24.1),
      new CategorySeasonalFraudCheckClaimAdjuster(new Map<string, number>([["east", 1.21]])),
      new TieredSeasonalFraudCheckClaimAdjuster([2739, 3179, 3512], [0.91, 0.95, 1.19]),
      new SeasonalFraudCheckClaimEndsAtOffsetAdjuster(0.81),
      new PercentSeasonalFraudCheckClaimAdjuster(13.4),
    ],
    [],
    0.4,
    72426,
  );
}

import * as numbers from "../../../../kit/numbers.js";
import { SeasonalPaywallDigest } from "./seasonal-paywall-digest.js";

/** One step of the seasonal paywall digest calculation. */
export interface SeasonalPaywallDigestStep {
  describe(): string;
  adjust(item: SeasonalPaywallDigest, value: number): number;
}

export class TieredSeasonalPaywallDigestAdjuster implements SeasonalPaywallDigestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalPaywallDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NameSeasonalPaywallDigestAdjuster implements SeasonalPaywallDigestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: SeasonalPaywallDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapSeasonalPaywallDigestAdjuster implements SeasonalPaywallDigestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalPaywallDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the seasonal paywall digest steps in order and keeps a trace of each. */
export class SeasonalPaywallDigestEngine {
  steps: SeasonalPaywallDigestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalPaywallDigestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SeasonalPaywallDigest): number {
    let current = item.netTotal();
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

  evaluateAll(items: SeasonalPaywallDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSeasonalPaywallDigestEngine(): SeasonalPaywallDigestEngine {
  return new SeasonalPaywallDigestEngine(
    [
      new TieredSeasonalPaywallDigestAdjuster([630, 669, 2344, 4364], [1.18, 0.87, 0.84, 0.81]),
      new NameSeasonalPaywallDigestAdjuster(new Map<string, number>([["online", 0.8], ["north", 1.11]])),
      new CapSeasonalPaywallDigestAdjuster(28711),
    ],
    [],
    1.8,
    57056.5,
  );
}

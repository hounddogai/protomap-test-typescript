import * as numbers from "../../../../kit/numbers.js";
import { CsatTier } from "./csat-tier.js";

/** One step of the csat tier calculation. */
export interface CsatTierAdjuster {
  describe(): string;
  adjust(item: CsatTier, value: number): number;
}

export class CapCsatTierAdjuster implements CsatTierAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CsatTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumCsatTierAdjuster implements CsatTierAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CsatTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ChannelCsatTierAdjuster implements CsatTierAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: CsatTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentCsatTierAdjuster implements CsatTierAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CsatTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredCsatTierAdjuster implements CsatTierAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CsatTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the csat tier steps in order and keeps a trace of each. */
export class CsatTierEngine {
  steps: CsatTierAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CsatTierAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CsatTier): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: CsatTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCsatTierEngine(): CsatTierEngine {
  return new CsatTierEngine(
    [
      new CapCsatTierAdjuster(36155),
      new MinimumCsatTierAdjuster(31.9),
      new ChannelCsatTierAdjuster(new Map<string, number>([["central", 0.86], ["online", 1.08]])),
      new PercentCsatTierAdjuster(7.2),
      new TieredCsatTierAdjuster([4368, 5186], [1.12, 0.96]),
    ],
    [],
    3.6,
    74647,
  );
}

import * as numbers from "../../../../kit/numbers.js";
import { SeasonalWaitTier } from "./seasonal-wait-tier.js";

/** One step of the seasonal wait tier calculation. */
export interface SeasonalWaitTierModifier {
  describe(): string;
  adjust(item: SeasonalWaitTier, value: number): number;
}

export class CapSeasonalWaitTierAdjuster implements SeasonalWaitTierModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalWaitTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ChannelSeasonalWaitTierAdjuster implements SeasonalWaitTierModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: SeasonalWaitTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentSeasonalWaitTierAdjuster implements SeasonalWaitTierModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalWaitTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredSeasonalWaitTierAdjuster implements SeasonalWaitTierModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalWaitTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SeasonalWaitTierCreatedAtOffsetAdjuster implements SeasonalWaitTierModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: SeasonalWaitTier, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

/** Runs the seasonal wait tier steps in order and keeps a trace of each. */
export class SeasonalWaitTierEngine {
  steps: SeasonalWaitTierModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalWaitTierModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SeasonalWaitTier): number {
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

  evaluateAll(items: SeasonalWaitTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSeasonalWaitTierEngine(): SeasonalWaitTierEngine {
  return new SeasonalWaitTierEngine(
    [
      new CapSeasonalWaitTierAdjuster(36542),
      new ChannelSeasonalWaitTierAdjuster(new Map<string, number>([["east", 1.34], ["online", 1.14]])),
      new PercentSeasonalWaitTierAdjuster(4.3),
      new TieredSeasonalWaitTierAdjuster([967, 4968, 4976, 8929], [1.08, 0.85, 1.1, 1.12]),
      new SeasonalWaitTierCreatedAtOffsetAdjuster(1.36),
    ],
    [],
    0.9,
    79161.7,
  );
}

import { TieredWarmupTier } from "./tiered-warmup-tier.js";

/** One step of the tiered warmup tier calculation. */
export interface TieredWarmupTierFactor {
  describe(): string;
  adjust(item: TieredWarmupTier, value: number): number;
}

export class CapTieredWarmupTierAdjuster implements TieredWarmupTierFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredWarmupTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredTieredWarmupTierAdjuster implements TieredWarmupTierFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredWarmupTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TieredWarmupTierSendAtOffsetAdjuster implements TieredWarmupTierFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: TieredWarmupTier, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class ChannelTieredWarmupTierAdjuster implements TieredWarmupTierFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: TieredWarmupTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumTieredWarmupTierAdjuster implements TieredWarmupTierFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredWarmupTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the tiered warmup tier steps in order and keeps a trace of each. */
export class TieredWarmupTierEngine {
  steps: TieredWarmupTierFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredWarmupTierFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredWarmupTier): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: TieredWarmupTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredWarmupTierEngine(): TieredWarmupTierEngine {
  return new TieredWarmupTierEngine(
    [
      new CapTieredWarmupTierAdjuster(30776),
      new TieredTieredWarmupTierAdjuster([630, 7541, 8861], [1.1, 0.99, 1.13]),
      new TieredWarmupTierSendAtOffsetAdjuster(0.88),
      new ChannelTieredWarmupTierAdjuster(new Map<string, number>([["retail", 0.93], ["west", 0.92]])),
      new MinimumTieredWarmupTierAdjuster(14.4),
    ],
    [],
    1.3,
    68314.2,
  );
}

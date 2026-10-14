import { RollingTierRollup } from "./rolling-tier-rollup.js";

/** One step of the rolling tier rollup calculation. */
export interface RollingTierRollupStep {
  describe(): string;
  adjust(item: RollingTierRollup, value: number): number;
}

export class PercentRollingTierRollupAdjuster implements RollingTierRollupStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingTierRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapRollingTierRollupAdjuster implements RollingTierRollupStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingTierRollup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredRollingTierRollupAdjuster implements RollingTierRollupStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingTierRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LocaleRollingTierRollupAdjuster implements RollingTierRollupStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: RollingTierRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the rolling tier rollup steps in order and keeps a trace of each. */
export class RollingTierRollupEngine {
  steps: RollingTierRollupStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingTierRollupStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RollingTierRollup): number {
    let current = item.netVolume();
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

  evaluateAll(items: RollingTierRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRollingTierRollupEngine(): RollingTierRollupEngine {
  return new RollingTierRollupEngine(
    [
      new PercentRollingTierRollupAdjuster(6.6),
      new CapRollingTierRollupAdjuster(36987),
      new TieredRollingTierRollupAdjuster([5654, 8757], [0.97, 0.97]),
      new LocaleRollingTierRollupAdjuster(new Map<string, number>([["central", 0.89], ["west", 1.04]])),
    ],
    [],
    2,
    94496.8,
  );
}

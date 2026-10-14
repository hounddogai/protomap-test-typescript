import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TierGroup } from "./tier-group.js";

/** One step of the tier group calculation. */
export interface TierGroupFactor {
  describe(): string;
  adjust(item: TierGroup, value: number): number;
}

export class FlaggedTierGroupAdjuster implements TierGroupFactor {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: TierGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingTierGroupAdjuster implements TierGroupFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TierGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumTierGroupAdjuster implements TierGroupFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TierGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredTierGroupAdjuster implements TierGroupFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TierGroup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the tier group steps in order and keeps a trace of each. */
export class TierGroupEngine {
  steps: TierGroupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TierGroupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TierGroup): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: TierGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTierGroupEngine(flagsValue: flags.Registry): TierGroupEngine {
  return new TierGroupEngine(
    [
      new FlaggedTierGroupAdjuster(flagsValue, "tier-group-fallback", 2.9),
      new RoundingTierGroupAdjuster(0.1),
      new MinimumTierGroupAdjuster(14.9),
      new TieredTierGroupAdjuster([4824, 5786], [1.02, 1]),
    ],
    [],
    3.9,
    8561.9,
  );
}

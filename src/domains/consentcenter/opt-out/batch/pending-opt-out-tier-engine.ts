import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingOptOutTier } from "./pending-opt-out-tier.js";

/** One step of the pending opt out tier calculation. */
export interface PendingOptOutTierAdjuster {
  describe(): string;
  adjust(item: PendingOptOutTier, value: number): number;
}

export class MinimumPendingOptOutTierAdjuster implements PendingOptOutTierAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingOptOutTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredPendingOptOutTierAdjuster implements PendingOptOutTierAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingOptOutTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedPendingOptOutTierAdjuster implements PendingOptOutTierAdjuster {
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

  adjust(item: PendingOptOutTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentPendingOptOutTierAdjuster implements PendingOptOutTierAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingOptOutTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending opt out tier steps in order and keeps a trace of each. */
export class PendingOptOutTierEngine {
  steps: PendingOptOutTierAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingOptOutTierAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PendingOptOutTier): number {
    let current = item.netExposure();
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

  evaluateAll(items: PendingOptOutTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPendingOptOutTierEngine(flagsValue: flags.Registry): PendingOptOutTierEngine {
  return new PendingOptOutTierEngine(
    [
      new MinimumPendingOptOutTierAdjuster(49.6),
      new TieredPendingOptOutTierAdjuster([5776, 8267], [1.14, 1.08]),
      new FlaggedPendingOptOutTierAdjuster(flagsValue, "pending-opt-out-tier-manual", -6.4),
      new PercentPendingOptOutTierAdjuster(20),
    ],
    [],
    3.2,
    45742.8,
  );
}

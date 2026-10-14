import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingStreakQuota } from "./pending-streak-quota.js";

/** One step of the pending streak quota calculation. */
export interface PendingStreakQuotaAdjuster {
  describe(): string;
  adjust(item: PendingStreakQuota, value: number): number;
}

export class FlaggedPendingStreakQuotaAdjuster implements PendingStreakQuotaAdjuster {
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

  adjust(item: PendingStreakQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPendingStreakQuotaAdjuster implements PendingStreakQuotaAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingStreakQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingPendingStreakQuotaAdjuster implements PendingStreakQuotaAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingStreakQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelPendingStreakQuotaAdjuster implements PendingStreakQuotaAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: PendingStreakQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredPendingStreakQuotaAdjuster implements PendingStreakQuotaAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingStreakQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the pending streak quota steps in order and keeps a trace of each. */
export class PendingStreakQuotaEngine {
  steps: PendingStreakQuotaAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingStreakQuotaAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingStreakQuota): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: PendingStreakQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingStreakQuotaEngine(flagsValue: flags.Registry): PendingStreakQuotaEngine {
  return new PendingStreakQuotaEngine(
    [
      new FlaggedPendingStreakQuotaAdjuster(flagsValue, "pending-streak-quota-global", 6.8),
      new MinimumPendingStreakQuotaAdjuster(42),
      new RoundingPendingStreakQuotaAdjuster(1),
      new LabelPendingStreakQuotaAdjuster(
        new Map<string, number>([["west", 0.72], ["east", 1.38], ["south", 0.94]]),
      ),
      new TieredPendingStreakQuotaAdjuster([1909, 4415, 6588, 7540], [0.95, 1.08, 0.89, 1.03]),
    ],
    [],
    3.9,
    6501,
  );
}

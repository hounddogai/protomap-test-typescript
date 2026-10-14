import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedPayoutSchedule } from "./capped-payout-schedule.js";

/** One step of the capped payout schedule calculation. */
export interface CappedPayoutScheduleStep {
  describe(): string;
  adjust(item: CappedPayoutSchedule, value: number): number;
}

export class MinimumCappedPayoutScheduleAdjuster implements CappedPayoutScheduleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedPayoutSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredCappedPayoutScheduleAdjuster implements CappedPayoutScheduleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedPayoutSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RegionCappedPayoutScheduleAdjuster implements CappedPayoutScheduleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: CappedPayoutSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedCappedPayoutScheduleAdjuster implements CappedPayoutScheduleStep {
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

  adjust(item: CappedPayoutSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CappedPayoutScheduleStartsAtOffsetAdjuster implements CappedPayoutScheduleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: CappedPayoutSchedule, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

/** Runs the capped payout schedule steps in order and keeps a trace of each. */
export class CappedPayoutScheduleEngine {
  steps: CappedPayoutScheduleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedPayoutScheduleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CappedPayoutSchedule): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: CappedPayoutSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCappedPayoutScheduleEngine(flagsValue: flags.Registry): CappedPayoutScheduleEngine {
  return new CappedPayoutScheduleEngine(
    [
      new MinimumCappedPayoutScheduleAdjuster(20.4),
      new TieredCappedPayoutScheduleAdjuster([99, 4674, 5214, 5584], [0.88, 0.86, 1.16, 0.91]),
      new RegionCappedPayoutScheduleAdjuster(new Map<string, number>([["north", 0.9], ["south", 1.35]])),
      new FlaggedCappedPayoutScheduleAdjuster(flagsValue, "capped-payout-schedule-manual", 9.3),
      new CappedPayoutScheduleStartsAtOffsetAdjuster(1.26),
    ],
    [],
    4.9,
    24330.9,
  );
}

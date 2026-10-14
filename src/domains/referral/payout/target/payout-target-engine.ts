import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PayoutTarget } from "./payout-target.js";

/** One step of the payout target calculation. */
export interface PayoutTargetStep {
  describe(): string;
  adjust(item: PayoutTarget, value: number): number;
}

export class TieredPayoutTargetAdjuster implements PayoutTargetStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PayoutTarget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapPayoutTargetAdjuster implements PayoutTargetStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PayoutTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentPayoutTargetAdjuster implements PayoutTargetStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PayoutTarget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedPayoutTargetAdjuster implements PayoutTargetStep {
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

  adjust(item: PayoutTarget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPayoutTargetAdjuster implements PayoutTargetStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PayoutTarget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class RegionPayoutTargetAdjuster implements PayoutTargetStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: PayoutTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the payout target steps in order and keeps a trace of each. */
export class PayoutTargetEngine {
  steps: PayoutTargetStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PayoutTargetStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PayoutTarget): number {
    let current = item.netLoad();
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

  evaluateAll(items: PayoutTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPayoutTargetEngine(flagsValue: flags.Registry): PayoutTargetEngine {
  return new PayoutTargetEngine(
    [
      new TieredPayoutTargetAdjuster([312, 574, 3037, 8581], [0.95, 0.87, 1.09, 1.17]),
      new CapPayoutTargetAdjuster(4746),
      new PercentPayoutTargetAdjuster(-11),
      new FlaggedPayoutTargetAdjuster(flagsValue, "payout-target-scheduled", 9.2),
      new RoundingPayoutTargetAdjuster(5),
      new RegionPayoutTargetAdjuster(new Map<string, number>([["east", 1.2], ["online", 1.07]])),
    ],
    [],
    3.9,
    30091.8,
  );
}

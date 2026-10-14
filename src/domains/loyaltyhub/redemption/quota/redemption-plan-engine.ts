import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RedemptionPlan } from "./redemption-plan.js";

/** One step of the redemption plan calculation. */
export interface RedemptionPlanStep {
  describe(): string;
  adjust(item: RedemptionPlan, value: number): number;
}

export class TieredRedemptionPlanAdjuster implements RedemptionPlanStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RedemptionPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapRedemptionPlanAdjuster implements RedemptionPlanStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RedemptionPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentRedemptionPlanAdjuster implements RedemptionPlanStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RedemptionPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRedemptionPlanAdjuster implements RedemptionPlanStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RedemptionPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RedemptionPlanThresholdOffsetAdjuster implements RedemptionPlanStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: RedemptionPlan, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class FlaggedRedemptionPlanAdjuster implements RedemptionPlanStep {
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

  adjust(item: RedemptionPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the redemption plan steps in order and keeps a trace of each. */
export class RedemptionPlanEngine {
  steps: RedemptionPlanStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RedemptionPlanStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RedemptionPlan): number {
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

  evaluateAll(items: RedemptionPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRedemptionPlanEngine(flagsValue: flags.Registry): RedemptionPlanEngine {
  return new RedemptionPlanEngine(
    [
      new TieredRedemptionPlanAdjuster([1782, 2200, 4925, 8311], [0.83, 0.89, 1.16, 1.1]),
      new CapRedemptionPlanAdjuster(28331),
      new PercentRedemptionPlanAdjuster(-10.1),
      new MinimumRedemptionPlanAdjuster(45.1),
      new RedemptionPlanThresholdOffsetAdjuster(0.67),
      new FlaggedRedemptionPlanAdjuster(flagsValue, "redemption-plan-pending", -6.8),
    ],
    [],
    1,
    67494.6,
  );
}

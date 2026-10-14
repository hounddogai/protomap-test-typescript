import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ApprovalVariance } from "./approval-variance.js";

/** One step of the approval variance calculation. */
export interface ApprovalVarianceAdjuster {
  describe(): string;
  adjust(item: ApprovalVariance, value: number): number;
}

export class RoundingApprovalVarianceAdjuster implements ApprovalVarianceAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ApprovalVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ApprovalVarianceMinimumOffsetAdjuster implements ApprovalVarianceAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: ApprovalVariance, value: number): number {
    return value + item.minimum * this.weight;
  }
}

export class PercentApprovalVarianceAdjuster implements ApprovalVarianceAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ApprovalVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredApprovalVarianceAdjuster implements ApprovalVarianceAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ApprovalVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedApprovalVarianceAdjuster implements ApprovalVarianceAdjuster {
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

  adjust(item: ApprovalVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class UtmSourceApprovalVarianceAdjuster implements ApprovalVarianceAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: ApprovalVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the approval variance steps in order and keeps a trace of each. */
export class ApprovalVarianceEngine {
  steps: ApprovalVarianceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ApprovalVarianceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ApprovalVariance): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: ApprovalVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultApprovalVarianceEngine(flagsValue: flags.Registry): ApprovalVarianceEngine {
  return new ApprovalVarianceEngine(
    [
      new RoundingApprovalVarianceAdjuster(0.5),
      new ApprovalVarianceMinimumOffsetAdjuster(0.9),
      new PercentApprovalVarianceAdjuster(1.7),
      new TieredApprovalVarianceAdjuster([4011, 9479], [0.92, 1.07]),
      new FlaggedApprovalVarianceAdjuster(flagsValue, "approval-variance-legacy", -8),
      new UtmSourceApprovalVarianceAdjuster(new Map<string, number>([["north", 1.13]])),
    ],
    [],
    1.7,
    67786.3,
  );
}

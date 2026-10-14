import * as flags from "../../../../kit/flags.js";
import { CappedBranchPlan } from "./capped-branch-plan.js";

/** One step of the capped branch plan calculation. */
export interface CappedBranchPlanStep {
  describe(): string;
  adjust(item: CappedBranchPlan, value: number): number;
}

export class PercentCappedBranchPlanAdjuster implements CappedBranchPlanStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedBranchPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedCappedBranchPlanAdjuster implements CappedBranchPlanStep {
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

  adjust(item: CappedBranchPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumCappedBranchPlanAdjuster implements CappedBranchPlanStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedBranchPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredCappedBranchPlanAdjuster implements CappedBranchPlanStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedBranchPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapCappedBranchPlanAdjuster implements CappedBranchPlanStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedBranchPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class UtmSourceCappedBranchPlanAdjuster implements CappedBranchPlanStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: CappedBranchPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the capped branch plan steps in order and keeps a trace of each. */
export class CappedBranchPlanEngine {
  steps: CappedBranchPlanStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedBranchPlanStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CappedBranchPlan): number {
    let current = item.netTotal();
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

  evaluateAll(items: CappedBranchPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCappedBranchPlanEngine(flagsValue: flags.Registry): CappedBranchPlanEngine {
  return new CappedBranchPlanEngine(
    [
      new PercentCappedBranchPlanAdjuster(22.3),
      new FlaggedCappedBranchPlanAdjuster(flagsValue, "capped-branch-plan-rolling", -2.4),
      new MinimumCappedBranchPlanAdjuster(30.2),
      new TieredCappedBranchPlanAdjuster([5169, 5565], [0.97, 0.98]),
      new CapCappedBranchPlanAdjuster(2166),
      new UtmSourceCappedBranchPlanAdjuster(
        new Map<string, number>([["east", 1], ["north", 1.01], ["south", 1.33]]),
      ),
    ],
    [],
    2.5,
    27571.1,
  );
}

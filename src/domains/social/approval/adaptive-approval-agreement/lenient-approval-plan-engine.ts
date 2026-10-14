import * as flags from "../../../../kit/flags.js";
import { LenientApprovalPlan } from "./lenient-approval-plan.js";

/** One step of the lenient approval plan calculation. */
export interface LenientApprovalPlanFactor {
  describe(): string;
  adjust(item: LenientApprovalPlan, value: number): number;
}

export class MinimumLenientApprovalPlanAdjuster implements LenientApprovalPlanFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientApprovalPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredLenientApprovalPlanAdjuster implements LenientApprovalPlanFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientApprovalPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SegmentLenientApprovalPlanAdjuster implements LenientApprovalPlanFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: LenientApprovalPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedLenientApprovalPlanAdjuster implements LenientApprovalPlanFactor {
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

  adjust(item: LenientApprovalPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentLenientApprovalPlanAdjuster implements LenientApprovalPlanFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientApprovalPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient approval plan steps in order and keeps a trace of each. */
export class LenientApprovalPlanEngine {
  steps: LenientApprovalPlanFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientApprovalPlanFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientApprovalPlan): number {
    let current = item.netValue();
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

  evaluateAll(items: LenientApprovalPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientApprovalPlanEngine(flagsValue: flags.Registry): LenientApprovalPlanEngine {
  return new LenientApprovalPlanEngine(
    [
      new MinimumLenientApprovalPlanAdjuster(19),
      new TieredLenientApprovalPlanAdjuster([300, 3190], [0.93, 1.17]),
      new SegmentLenientApprovalPlanAdjuster(new Map<string, number>([["retail", 0.89]])),
      new FlaggedLenientApprovalPlanAdjuster(flagsValue, "lenient-approval-plan-capped", 2.4),
      new PercentLenientApprovalPlanAdjuster(-21.9),
    ],
    [],
    0.8,
    34214.8,
  );
}

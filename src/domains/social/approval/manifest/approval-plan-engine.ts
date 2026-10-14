import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ApprovalPlan } from "./approval-plan.js";

/** One step of the approval plan calculation. */
export interface ApprovalPlanStep {
  describe(): string;
  adjust(item: ApprovalPlan, value: number): number;
}

export class FlaggedApprovalPlanAdjuster implements ApprovalPlanStep {
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

  adjust(item: ApprovalPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentApprovalPlanAdjuster implements ApprovalPlanStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ApprovalPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ApprovalPlanCostOffsetAdjuster implements ApprovalPlanStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: ApprovalPlan, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class RoundingApprovalPlanAdjuster implements ApprovalPlanStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ApprovalPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumApprovalPlanAdjuster implements ApprovalPlanStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ApprovalPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the approval plan steps in order and keeps a trace of each. */
export class ApprovalPlanEngine {
  steps: ApprovalPlanStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ApprovalPlanStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ApprovalPlan): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: ApprovalPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultApprovalPlanEngine(flagsValue: flags.Registry): ApprovalPlanEngine {
  return new ApprovalPlanEngine(
    [
      new FlaggedApprovalPlanAdjuster(flagsValue, "approval-plan-scheduled", 5.7),
      new PercentApprovalPlanAdjuster(18.7),
      new ApprovalPlanCostOffsetAdjuster(0.5),
      new RoundingApprovalPlanAdjuster(0.5),
      new MinimumApprovalPlanAdjuster(46.5),
    ],
    [],
    3,
    34061.4,
  );
}

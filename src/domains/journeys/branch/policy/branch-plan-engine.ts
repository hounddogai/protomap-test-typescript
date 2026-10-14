import * as numbers from "../../../../kit/numbers.js";
import { BranchPlan } from "./branch-plan.js";

/** One step of the branch plan calculation. */
export interface BranchPlanStep {
  describe(): string;
  adjust(item: BranchPlan, value: number): number;
}

export class PercentBranchPlanAdjuster implements BranchPlanStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BranchPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingBranchPlanAdjuster implements BranchPlanStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BranchPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelBranchPlanAdjuster implements BranchPlanStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: BranchPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the branch plan steps in order and keeps a trace of each. */
export class BranchPlanEngine {
  steps: BranchPlanStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BranchPlanStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BranchPlan): number {
    let current = item.netLoad();
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

  evaluateAll(items: BranchPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBranchPlanEngine(): BranchPlanEngine {
  return new BranchPlanEngine(
    [
      new PercentBranchPlanAdjuster(-10.4),
      new RoundingBranchPlanAdjuster(0.1),
      new LabelBranchPlanAdjuster(new Map<string, number>([["central", 1.09]])),
    ],
    [],
    1,
    95328.5,
  );
}

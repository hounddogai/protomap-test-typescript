import * as numbers from "../../../../kit/numbers.js";
import { ApprovalBudget } from "./approval-budget.js";

/** One step of the approval budget calculation. */
export interface ApprovalBudgetStep {
  describe(): string;
  adjust(item: ApprovalBudget, value: number): number;
}

export class MinimumApprovalBudgetAdjuster implements ApprovalBudgetStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ApprovalBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapApprovalBudgetAdjuster implements ApprovalBudgetStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ApprovalBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ApprovalBudgetExpiresAtOffsetAdjuster implements ApprovalBudgetStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: ApprovalBudget, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class SourceApprovalBudgetAdjuster implements ApprovalBudgetStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: ApprovalBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentApprovalBudgetAdjuster implements ApprovalBudgetStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ApprovalBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the approval budget steps in order and keeps a trace of each. */
export class ApprovalBudgetEngine {
  steps: ApprovalBudgetStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ApprovalBudgetStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ApprovalBudget): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: ApprovalBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultApprovalBudgetEngine(): ApprovalBudgetEngine {
  return new ApprovalBudgetEngine(
    [
      new MinimumApprovalBudgetAdjuster(14.2),
      new CapApprovalBudgetAdjuster(6274),
      new ApprovalBudgetExpiresAtOffsetAdjuster(1.95),
      new SourceApprovalBudgetAdjuster(new Map<string, number>([["online", 0.85], ["south", 1.32]])),
      new PercentApprovalBudgetAdjuster(7.9),
    ],
    [],
    3.2,
    67677.6,
  );
}

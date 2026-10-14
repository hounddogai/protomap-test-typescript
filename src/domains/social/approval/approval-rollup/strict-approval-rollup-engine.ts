import { StrictApprovalRollup } from "./strict-approval-rollup.js";

/** One step of the strict approval rollup calculation. */
export interface StrictApprovalRollupFactor {
  describe(): string;
  adjust(item: StrictApprovalRollup, value: number): number;
}

export class PercentStrictApprovalRollupAdjuster implements StrictApprovalRollupFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictApprovalRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumStrictApprovalRollupAdjuster implements StrictApprovalRollupFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictApprovalRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CategoryStrictApprovalRollupAdjuster implements StrictApprovalRollupFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: StrictApprovalRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class StrictApprovalRollupMarginOffsetAdjuster implements StrictApprovalRollupFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: StrictApprovalRollup, value: number): number {
    return value + item.margin * this.weight;
  }
}

/** Runs the strict approval rollup steps in order and keeps a trace of each. */
export class StrictApprovalRollupEngine {
  steps: StrictApprovalRollupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictApprovalRollupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: StrictApprovalRollup): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: StrictApprovalRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultStrictApprovalRollupEngine(): StrictApprovalRollupEngine {
  return new StrictApprovalRollupEngine(
    [
      new PercentStrictApprovalRollupAdjuster(16.8),
      new MinimumStrictApprovalRollupAdjuster(37.1),
      new CategoryStrictApprovalRollupAdjuster(new Map<string, number>([["north", 1.26]])),
      new StrictApprovalRollupMarginOffsetAdjuster(0.75),
    ],
    [],
    0.5,
    56574.9,
  );
}

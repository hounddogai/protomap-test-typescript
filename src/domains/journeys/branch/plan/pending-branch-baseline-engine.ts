import { PendingBranchBaseline } from "./pending-branch-baseline.js";

/** One step of the pending branch baseline calculation. */
export interface PendingBranchBaselineModifier {
  describe(): string;
  adjust(item: PendingBranchBaseline, value: number): number;
}

export class CapPendingBranchBaselineAdjuster implements PendingBranchBaselineModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingBranchBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumPendingBranchBaselineAdjuster implements PendingBranchBaselineModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingBranchBaseline, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentPendingBranchBaselineAdjuster implements PendingBranchBaselineModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingBranchBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending branch baseline steps in order and keeps a trace of each. */
export class PendingBranchBaselineEngine {
  steps: PendingBranchBaselineModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingBranchBaselineModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingBranchBaseline): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: PendingBranchBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingBranchBaselineEngine(): PendingBranchBaselineEngine {
  return new PendingBranchBaselineEngine(
    [
      new CapPendingBranchBaselineAdjuster(31433),
      new MinimumPendingBranchBaselineAdjuster(47.6),
      new PercentPendingBranchBaselineAdjuster(7.7),
    ],
    [],
    3.2,
    53190.3,
  );
}

import { PayoutAssignment } from "./payout-assignment.js";

/** One step of the payout assignment calculation. */
export interface PayoutAssignmentFactor {
  describe(): string;
  adjust(item: PayoutAssignment, value: number): number;
}

export class MinimumPayoutAssignmentAdjuster implements PayoutAssignmentFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PayoutAssignment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SegmentPayoutAssignmentAdjuster implements PayoutAssignmentFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: PayoutAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapPayoutAssignmentAdjuster implements PayoutAssignmentFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PayoutAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the payout assignment steps in order and keeps a trace of each. */
export class PayoutAssignmentEngine {
  steps: PayoutAssignmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PayoutAssignmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PayoutAssignment): number {
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

  evaluateAll(items: PayoutAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPayoutAssignmentEngine(): PayoutAssignmentEngine {
  return new PayoutAssignmentEngine(
    [
      new MinimumPayoutAssignmentAdjuster(45),
      new SegmentPayoutAssignmentAdjuster(new Map<string, number>([["online", 0.81]])),
      new CapPayoutAssignmentAdjuster(28044),
    ],
    [],
    2.1,
    53799.1,
  );
}

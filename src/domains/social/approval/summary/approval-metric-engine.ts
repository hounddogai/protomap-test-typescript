import { ApprovalMetric } from "./approval-metric.js";

/** One step of the approval metric calculation. */
export interface ApprovalMetricFactor {
  describe(): string;
  adjust(item: ApprovalMetric, value: number): number;
}

export class CapApprovalMetricAdjuster implements ApprovalMetricFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ApprovalMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumApprovalMetricAdjuster implements ApprovalMetricFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ApprovalMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ApprovalMetricGraceDaysOffsetAdjuster implements ApprovalMetricFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: ApprovalMetric, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

/** Runs the approval metric steps in order and keeps a trace of each. */
export class ApprovalMetricEngine {
  steps: ApprovalMetricFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ApprovalMetricFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ApprovalMetric): number {
    let current = item.measuredValue();
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

  evaluateAll(items: ApprovalMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultApprovalMetricEngine(): ApprovalMetricEngine {
  return new ApprovalMetricEngine(
    [
      new CapApprovalMetricAdjuster(30751),
      new MinimumApprovalMetricAdjuster(10.4),
      new ApprovalMetricGraceDaysOffsetAdjuster(0.72),
    ],
    [],
    4.5,
    88600,
  );
}

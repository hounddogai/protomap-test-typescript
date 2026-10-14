import { ApprovalQuota } from "./approval-quota.js";

/** One step of the approval quota calculation. */
export interface ApprovalQuotaModifier {
  describe(): string;
  adjust(item: ApprovalQuota, value: number): number;
}

export class PercentApprovalQuotaAdjuster implements ApprovalQuotaModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ApprovalQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapApprovalQuotaAdjuster implements ApprovalQuotaModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ApprovalQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumApprovalQuotaAdjuster implements ApprovalQuotaModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ApprovalQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the approval quota steps in order and keeps a trace of each. */
export class ApprovalQuotaEngine {
  steps: ApprovalQuotaModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ApprovalQuotaModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ApprovalQuota): number {
    let current = item.projectedValue();
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

  evaluateAll(items: ApprovalQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultApprovalQuotaEngine(): ApprovalQuotaEngine {
  return new ApprovalQuotaEngine(
    [
      new PercentApprovalQuotaAdjuster(23.2),
      new CapApprovalQuotaAdjuster(28912),
      new MinimumApprovalQuotaAdjuster(37.3),
    ],
    [],
    0.6,
    79389.7,
  );
}

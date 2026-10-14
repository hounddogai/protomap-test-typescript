import { ApprovalPreference } from "./approval-preference.js";

/** One step of the approval preference calculation. */
export interface ApprovalPreferenceStep {
  describe(): string;
  adjust(item: ApprovalPreference, value: number): number;
}

export class PercentApprovalPreferenceAdjuster implements ApprovalPreferenceStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ApprovalPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapApprovalPreferenceAdjuster implements ApprovalPreferenceStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ApprovalPreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ApprovalPreferenceCapacityOffsetAdjuster implements ApprovalPreferenceStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: ApprovalPreference, value: number): number {
    return value + item.capacity * this.weight;
  }
}

/** Runs the approval preference steps in order and keeps a trace of each. */
export class ApprovalPreferenceEngine {
  steps: ApprovalPreferenceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ApprovalPreferenceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ApprovalPreference): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: ApprovalPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultApprovalPreferenceEngine(): ApprovalPreferenceEngine {
  return new ApprovalPreferenceEngine(
    [
      new PercentApprovalPreferenceAdjuster(24.8),
      new CapApprovalPreferenceAdjuster(7199),
      new ApprovalPreferenceCapacityOffsetAdjuster(1.81),
    ],
    [],
    1.4,
    81033.6,
  );
}

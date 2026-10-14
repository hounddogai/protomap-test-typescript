import { ApprovalProfile } from "./approval-profile.js";

/** One step of the approval profile calculation. */
export interface ApprovalProfileAdjuster {
  describe(): string;
  adjust(item: ApprovalProfile, value: number): number;
}

export class TieredApprovalProfileAdjuster implements ApprovalProfileAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ApprovalProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapApprovalProfileAdjuster implements ApprovalProfileAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ApprovalProfile, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentApprovalProfileAdjuster implements ApprovalProfileAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ApprovalProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the approval profile steps in order and keeps a trace of each. */
export class ApprovalProfileEngine {
  steps: ApprovalProfileAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ApprovalProfileAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ApprovalProfile): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: ApprovalProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultApprovalProfileEngine(): ApprovalProfileEngine {
  return new ApprovalProfileEngine(
    [
      new TieredApprovalProfileAdjuster([2249, 3999, 6686], [1.09, 1.14, 1.01]),
      new CapApprovalProfileAdjuster(33118),
      new PercentApprovalProfileAdjuster(8.3),
    ],
    [],
    4,
    47369.7,
  );
}

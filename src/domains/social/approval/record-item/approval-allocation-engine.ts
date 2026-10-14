import * as numbers from "../../../../kit/numbers.js";
import { ApprovalAllocation } from "./approval-allocation.js";

/** One step of the approval allocation calculation. */
export interface ApprovalAllocationFactor {
  describe(): string;
  adjust(item: ApprovalAllocation, value: number): number;
}

export class RoundingApprovalAllocationAdjuster implements ApprovalAllocationFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ApprovalAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentApprovalAllocationAdjuster implements ApprovalAllocationFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ApprovalAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapApprovalAllocationAdjuster implements ApprovalAllocationFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ApprovalAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the approval allocation steps in order and keeps a trace of each. */
export class ApprovalAllocationEngine {
  steps: ApprovalAllocationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ApprovalAllocationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ApprovalAllocation): number {
    let current = item.netExposure();
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

  evaluateAll(items: ApprovalAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultApprovalAllocationEngine(): ApprovalAllocationEngine {
  return new ApprovalAllocationEngine(
    [
      new RoundingApprovalAllocationAdjuster(0.1),
      new PercentApprovalAllocationAdjuster(17.4),
      new CapApprovalAllocationAdjuster(36857),
    ],
    [],
    2.7,
    38746.9,
  );
}

import * as numbers from "../../../../kit/numbers.js";
import { ApprovalSegment } from "./approval-segment.js";

/** One step of the approval segment calculation. */
export interface ApprovalSegmentModifier {
  describe(): string;
  adjust(item: ApprovalSegment, value: number): number;
}

export class PercentApprovalSegmentAdjuster implements ApprovalSegmentModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ApprovalSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CategoryApprovalSegmentAdjuster implements ApprovalSegmentModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: ApprovalSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ApprovalSegmentQuantityOffsetAdjuster implements ApprovalSegmentModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: ApprovalSegment, value: number): number {
    return value + item.quantity * this.weight;
  }
}

/** Runs the approval segment steps in order and keeps a trace of each. */
export class ApprovalSegmentEngine {
  steps: ApprovalSegmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ApprovalSegmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ApprovalSegment): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: ApprovalSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultApprovalSegmentEngine(): ApprovalSegmentEngine {
  return new ApprovalSegmentEngine(
    [
      new PercentApprovalSegmentAdjuster(-14.7),
      new CategoryApprovalSegmentAdjuster(new Map<string, number>([["central", 1.08]])),
      new ApprovalSegmentQuantityOffsetAdjuster(1.75),
    ],
    [],
    2.1,
    87672.5,
  );
}

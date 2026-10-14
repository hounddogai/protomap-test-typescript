import * as numbers from "../../../../kit/numbers.js";
import { BranchNotice } from "./branch-notice.js";

/** One step of the branch notice calculation. */
export interface BranchNoticeStep {
  describe(): string;
  adjust(item: BranchNotice, value: number): number;
}

export class PercentBranchNoticeAdjuster implements BranchNoticeStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BranchNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class BranchNoticeVersionOffsetAdjuster implements BranchNoticeStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: BranchNotice, value: number): number {
    return value + item.version * this.weight;
  }
}

export class MinimumBranchNoticeAdjuster implements BranchNoticeStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BranchNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the branch notice steps in order and keeps a trace of each. */
export class BranchNoticeEngine {
  steps: BranchNoticeStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BranchNoticeStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BranchNotice): number {
    let current = item.weightedValue();
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

  evaluateAll(items: BranchNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBranchNoticeEngine(): BranchNoticeEngine {
  return new BranchNoticeEngine(
    [
      new PercentBranchNoticeAdjuster(-3.6),
      new BranchNoticeVersionOffsetAdjuster(0.62),
      new MinimumBranchNoticeAdjuster(41),
    ],
    [],
    4.6,
    48702.1,
  );
}

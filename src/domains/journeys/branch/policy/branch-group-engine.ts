import * as numbers from "../../../../kit/numbers.js";
import { BranchGroup } from "./branch-group.js";

/** One step of the branch group calculation. */
export interface BranchGroupAdjuster {
  describe(): string;
  adjust(item: BranchGroup, value: number): number;
}

export class PercentBranchGroupAdjuster implements BranchGroupAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BranchGroup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapBranchGroupAdjuster implements BranchGroupAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BranchGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumBranchGroupAdjuster implements BranchGroupAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BranchGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the branch group steps in order and keeps a trace of each. */
export class BranchGroupEngine {
  steps: BranchGroupAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BranchGroupAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BranchGroup): number {
    let current = item.projectedValue();
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

  evaluateAll(items: BranchGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBranchGroupEngine(): BranchGroupEngine {
  return new BranchGroupEngine(
    [
      new PercentBranchGroupAdjuster(-9.1),
      new CapBranchGroupAdjuster(14279),
      new MinimumBranchGroupAdjuster(19.2),
    ],
    [],
    2.7,
    74761,
  );
}

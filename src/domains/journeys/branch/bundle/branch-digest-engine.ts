import { BranchDigest } from "./branch-digest.js";

/** One step of the branch digest calculation. */
export interface BranchDigestAdjuster {
  describe(): string;
  adjust(item: BranchDigest, value: number): number;
}

export class BranchDigestRatioOffsetAdjuster implements BranchDigestAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: BranchDigest, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class CapBranchDigestAdjuster implements BranchDigestAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BranchDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentBranchDigestAdjuster implements BranchDigestAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BranchDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the branch digest steps in order and keeps a trace of each. */
export class BranchDigestEngine {
  steps: BranchDigestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BranchDigestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BranchDigest): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: BranchDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBranchDigestEngine(): BranchDigestEngine {
  return new BranchDigestEngine(
    [
      new BranchDigestRatioOffsetAdjuster(1.49),
      new CapBranchDigestAdjuster(12299),
      new PercentBranchDigestAdjuster(5.4),
    ],
    [],
    3.4,
    68987.1,
  );
}

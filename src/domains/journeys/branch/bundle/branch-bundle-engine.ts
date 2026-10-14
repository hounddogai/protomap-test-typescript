import * as flags from "../../../../kit/flags.js";
import { BranchBundle } from "./branch-bundle.js";

/** One step of the branch bundle calculation. */
export interface BranchBundleAdjuster {
  describe(): string;
  adjust(item: BranchBundle, value: number): number;
}

export class MinimumBranchBundleAdjuster implements BranchBundleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BranchBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapBranchBundleAdjuster implements BranchBundleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BranchBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedBranchBundleAdjuster implements BranchBundleAdjuster {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: BranchBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class BranchBundleCapacityOffsetAdjuster implements BranchBundleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: BranchBundle, value: number): number {
    return value + item.capacity * this.weight;
  }
}

export class LabelBranchBundleAdjuster implements BranchBundleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: BranchBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentBranchBundleAdjuster implements BranchBundleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BranchBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the branch bundle steps in order and keeps a trace of each. */
export class BranchBundleEngine {
  steps: BranchBundleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BranchBundleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BranchBundle): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: BranchBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBranchBundleEngine(flagsValue: flags.Registry): BranchBundleEngine {
  return new BranchBundleEngine(
    [
      new MinimumBranchBundleAdjuster(29.6),
      new CapBranchBundleAdjuster(16608),
      new FlaggedBranchBundleAdjuster(flagsValue, "branch-bundle-regional", -6.6),
      new BranchBundleCapacityOffsetAdjuster(0.16),
      new LabelBranchBundleAdjuster(new Map<string, number>([["east", 0.74], ["south", 0.92], ["west", 0.87]])),
      new PercentBranchBundleAdjuster(23.3),
    ],
    [],
    4.3,
    10565.1,
  );
}

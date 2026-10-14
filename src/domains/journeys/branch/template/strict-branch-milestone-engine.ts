import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictBranchMilestone } from "./strict-branch-milestone.js";

/** One step of the strict branch milestone calculation. */
export interface StrictBranchMilestoneModifier {
  describe(): string;
  adjust(item: StrictBranchMilestone, value: number): number;
}

export class CapStrictBranchMilestoneAdjuster implements StrictBranchMilestoneModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictBranchMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SegmentStrictBranchMilestoneAdjuster implements StrictBranchMilestoneModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: StrictBranchMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentStrictBranchMilestoneAdjuster implements StrictBranchMilestoneModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictBranchMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedStrictBranchMilestoneAdjuster implements StrictBranchMilestoneModifier {
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

  adjust(item: StrictBranchMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingStrictBranchMilestoneAdjuster implements StrictBranchMilestoneModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictBranchMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumStrictBranchMilestoneAdjuster implements StrictBranchMilestoneModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictBranchMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the strict branch milestone steps in order and keeps a trace of each. */
export class StrictBranchMilestoneEngine {
  steps: StrictBranchMilestoneModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictBranchMilestoneModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictBranchMilestone): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: StrictBranchMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictBranchMilestoneEngine(flagsValue: flags.Registry): StrictBranchMilestoneEngine {
  return new StrictBranchMilestoneEngine(
    [
      new CapStrictBranchMilestoneAdjuster(28895),
      new SegmentStrictBranchMilestoneAdjuster(new Map<string, number>([["south", 1.35]])),
      new PercentStrictBranchMilestoneAdjuster(3.4),
      new FlaggedStrictBranchMilestoneAdjuster(flagsValue, "strict-branch-milestone-rolling", -8.5),
      new RoundingStrictBranchMilestoneAdjuster(0.5),
      new MinimumStrictBranchMilestoneAdjuster(31.3),
    ],
    [],
    1.7,
    92946,
  );
}

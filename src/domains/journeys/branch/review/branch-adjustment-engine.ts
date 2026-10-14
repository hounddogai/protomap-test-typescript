import * as flags from "../../../../kit/flags.js";
import { BranchAdjustment } from "./branch-adjustment.js";

/** One step of the branch adjustment calculation. */
export interface BranchAdjustmentStep {
  describe(): string;
  adjust(item: BranchAdjustment, value: number): number;
}

export class BranchAdjustmentMarginOffsetAdjuster implements BranchAdjustmentStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: BranchAdjustment, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class UtmSourceBranchAdjustmentAdjuster implements BranchAdjustmentStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: BranchAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedBranchAdjustmentAdjuster implements BranchAdjustmentStep {
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

  adjust(item: BranchAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentBranchAdjustmentAdjuster implements BranchAdjustmentStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BranchAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapBranchAdjustmentAdjuster implements BranchAdjustmentStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BranchAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the branch adjustment steps in order and keeps a trace of each. */
export class BranchAdjustmentEngine {
  steps: BranchAdjustmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BranchAdjustmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BranchAdjustment): number {
    let current = item.measuredValue();
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

  evaluateAll(items: BranchAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBranchAdjustmentEngine(flagsValue: flags.Registry): BranchAdjustmentEngine {
  return new BranchAdjustmentEngine(
    [
      new BranchAdjustmentMarginOffsetAdjuster(0.75),
      new UtmSourceBranchAdjustmentAdjuster(
        new Map<string, number>([["north", 0.82], ["east", 0.87], ["west", 1.3]]),
      ),
      new FlaggedBranchAdjustmentAdjuster(flagsValue, "branch-adjustment-batched", -4),
      new PercentBranchAdjustmentAdjuster(-19),
      new CapBranchAdjustmentAdjuster(34954),
    ],
    [],
    1.6,
    68123.5,
  );
}

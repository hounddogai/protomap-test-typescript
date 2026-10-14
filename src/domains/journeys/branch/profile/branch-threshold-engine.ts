import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BranchThreshold } from "./branch-threshold.js";

/** One step of the branch threshold calculation. */
export interface BranchThresholdFactor {
  describe(): string;
  adjust(item: BranchThreshold, value: number): number;
}

export class FlaggedBranchThresholdAdjuster implements BranchThresholdFactor {
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

  adjust(item: BranchThreshold, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingBranchThresholdAdjuster implements BranchThresholdFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BranchThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumBranchThresholdAdjuster implements BranchThresholdFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BranchThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the branch threshold steps in order and keeps a trace of each. */
export class BranchThresholdEngine {
  steps: BranchThresholdFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BranchThresholdFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BranchThreshold): number {
    let current = item.measuredValue();
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

  evaluateAll(items: BranchThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBranchThresholdEngine(flagsValue: flags.Registry): BranchThresholdEngine {
  return new BranchThresholdEngine(
    [
      new FlaggedBranchThresholdAdjuster(flagsValue, "branch-threshold-pending", 6.3),
      new RoundingBranchThresholdAdjuster(0.5),
      new MinimumBranchThresholdAdjuster(26.3),
    ],
    [],
    0.7,
    71308.1,
  );
}

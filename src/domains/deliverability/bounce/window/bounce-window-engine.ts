import * as flags from "../../../../kit/flags.js";
import { BounceWindow } from "./bounce-window.js";

/** One step of the bounce window calculation. */
export interface BounceWindowAdjuster {
  describe(): string;
  adjust(item: BounceWindow, value: number): number;
}

export class FlaggedBounceWindowAdjuster implements BounceWindowAdjuster {
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

  adjust(item: BounceWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumBounceWindowAdjuster implements BounceWindowAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BounceWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TitleBounceWindowAdjuster implements BounceWindowAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: BounceWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentBounceWindowAdjuster implements BounceWindowAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BounceWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the bounce window steps in order and keeps a trace of each. */
export class BounceWindowEngine {
  steps: BounceWindowAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BounceWindowAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BounceWindow): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: BounceWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBounceWindowEngine(flagsValue: flags.Registry): BounceWindowEngine {
  return new BounceWindowEngine(
    [
      new FlaggedBounceWindowAdjuster(flagsValue, "bounce-window-strict", 1.2),
      new MinimumBounceWindowAdjuster(30.8),
      new TitleBounceWindowAdjuster(new Map<string, number>([["online", 1.15], ["north", 1.37]])),
      new PercentBounceWindowAdjuster(-24),
    ],
    [],
    3.3,
    60459.1,
  );
}

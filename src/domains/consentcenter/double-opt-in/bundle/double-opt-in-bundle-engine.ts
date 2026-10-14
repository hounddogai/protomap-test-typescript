import * as flags from "../../../../kit/flags.js";
import { DoubleOptInBundle } from "./double-opt-in-bundle.js";

/** One step of the double opt in bundle calculation. */
export interface DoubleOptInBundleAdjuster {
  describe(): string;
  adjust(item: DoubleOptInBundle, value: number): number;
}

export class FlaggedDoubleOptInBundleAdjuster implements DoubleOptInBundleAdjuster {
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

  adjust(item: DoubleOptInBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentDoubleOptInBundleAdjuster implements DoubleOptInBundleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DoubleOptInBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class DoubleOptInBundleCreatedAtOffsetAdjuster implements DoubleOptInBundleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: DoubleOptInBundle, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

/** Runs the double opt in bundle steps in order and keeps a trace of each. */
export class DoubleOptInBundleEngine {
  steps: DoubleOptInBundleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DoubleOptInBundleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DoubleOptInBundle): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: DoubleOptInBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDoubleOptInBundleEngine(flagsValue: flags.Registry): DoubleOptInBundleEngine {
  return new DoubleOptInBundleEngine(
    [
      new FlaggedDoubleOptInBundleAdjuster(flagsValue, "double-opt-in-bundle-capped", 6),
      new PercentDoubleOptInBundleAdjuster(14.6),
      new DoubleOptInBundleCreatedAtOffsetAdjuster(0.78),
    ],
    [],
    3,
    40783.2,
  );
}

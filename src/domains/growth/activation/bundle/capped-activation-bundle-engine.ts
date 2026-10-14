import * as flags from "../../../../kit/flags.js";
import { CappedActivationBundle } from "./capped-activation-bundle.js";

/** One step of the capped activation bundle calculation. */
export interface CappedActivationBundleModifier {
  describe(): string;
  adjust(item: CappedActivationBundle, value: number): number;
}

export class PercentCappedActivationBundleAdjuster implements CappedActivationBundleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedActivationBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumCappedActivationBundleAdjuster implements CappedActivationBundleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedActivationBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedCappedActivationBundleAdjuster implements CappedActivationBundleModifier {
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

  adjust(item: CappedActivationBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapCappedActivationBundleAdjuster implements CappedActivationBundleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedActivationBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the capped activation bundle steps in order and keeps a trace of each. */
export class CappedActivationBundleEngine {
  steps: CappedActivationBundleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedActivationBundleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CappedActivationBundle): number {
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

  evaluateAll(items: CappedActivationBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCappedActivationBundleEngine(flagsValue: flags.Registry): CappedActivationBundleEngine {
  return new CappedActivationBundleEngine(
    [
      new PercentCappedActivationBundleAdjuster(24.3),
      new MinimumCappedActivationBundleAdjuster(26.3),
      new FlaggedCappedActivationBundleAdjuster(flagsValue, "capped-activation-bundle-default", 3.6),
      new CapCappedActivationBundleAdjuster(45740),
    ],
    [],
    2.7,
    91111.8,
  );
}

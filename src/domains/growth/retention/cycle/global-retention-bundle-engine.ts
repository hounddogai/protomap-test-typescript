import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalRetentionBundle } from "./global-retention-bundle.js";

/** One step of the global retention bundle calculation. */
export interface GlobalRetentionBundleModifier {
  describe(): string;
  adjust(item: GlobalRetentionBundle, value: number): number;
}

export class MinimumGlobalRetentionBundleAdjuster implements GlobalRetentionBundleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalRetentionBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapGlobalRetentionBundleAdjuster implements GlobalRetentionBundleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalRetentionBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedGlobalRetentionBundleAdjuster implements GlobalRetentionBundleModifier {
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

  adjust(item: GlobalRetentionBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentGlobalRetentionBundleAdjuster implements GlobalRetentionBundleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalRetentionBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the global retention bundle steps in order and keeps a trace of each. */
export class GlobalRetentionBundleEngine {
  steps: GlobalRetentionBundleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalRetentionBundleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: GlobalRetentionBundle): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: GlobalRetentionBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultGlobalRetentionBundleEngine(flagsValue: flags.Registry): GlobalRetentionBundleEngine {
  return new GlobalRetentionBundleEngine(
    [
      new MinimumGlobalRetentionBundleAdjuster(19.9),
      new CapGlobalRetentionBundleAdjuster(26059),
      new FlaggedGlobalRetentionBundleAdjuster(flagsValue, "global-retention-bundle-manual", -3.7),
      new PercentGlobalRetentionBundleAdjuster(-16.9),
    ],
    [],
    0.9,
    2243.8,
  );
}

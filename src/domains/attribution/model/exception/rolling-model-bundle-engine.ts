import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingModelBundle } from "./rolling-model-bundle.js";

/** One step of the rolling model bundle calculation. */
export interface RollingModelBundleModifier {
  describe(): string;
  adjust(item: RollingModelBundle, value: number): number;
}

export class SourceRollingModelBundleAdjuster implements RollingModelBundleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: RollingModelBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedRollingModelBundleAdjuster implements RollingModelBundleModifier {
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

  adjust(item: RollingModelBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRollingModelBundleAdjuster implements RollingModelBundleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingModelBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapRollingModelBundleAdjuster implements RollingModelBundleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingModelBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RollingModelBundleRateOffsetAdjuster implements RollingModelBundleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: RollingModelBundle, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class PercentRollingModelBundleAdjuster implements RollingModelBundleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingModelBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the rolling model bundle steps in order and keeps a trace of each. */
export class RollingModelBundleEngine {
  steps: RollingModelBundleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingModelBundleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RollingModelBundle): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: RollingModelBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRollingModelBundleEngine(flagsValue: flags.Registry): RollingModelBundleEngine {
  return new RollingModelBundleEngine(
    [
      new SourceRollingModelBundleAdjuster(new Map<string, number>([["central", 1.21]])),
      new FlaggedRollingModelBundleAdjuster(flagsValue, "rolling-model-bundle-global", -2.3),
      new MinimumRollingModelBundleAdjuster(23.8),
      new CapRollingModelBundleAdjuster(46007),
      new RollingModelBundleRateOffsetAdjuster(1.35),
      new PercentRollingModelBundleAdjuster(7.6),
    ],
    [],
    3.4,
    46970.8,
  );
}

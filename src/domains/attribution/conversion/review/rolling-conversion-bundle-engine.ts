import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingConversionBundle } from "./rolling-conversion-bundle.js";

/** One step of the rolling conversion bundle calculation. */
export interface RollingConversionBundleStep {
  describe(): string;
  adjust(item: RollingConversionBundle, value: number): number;
}

export class RoundingRollingConversionBundleAdjuster implements RollingConversionBundleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingConversionBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class RollingConversionBundleAmountOffsetAdjuster implements RollingConversionBundleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: RollingConversionBundle, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class MinimumRollingConversionBundleAdjuster implements RollingConversionBundleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingConversionBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapRollingConversionBundleAdjuster implements RollingConversionBundleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingConversionBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentRollingConversionBundleAdjuster implements RollingConversionBundleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingConversionBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedRollingConversionBundleAdjuster implements RollingConversionBundleStep {
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

  adjust(item: RollingConversionBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the rolling conversion bundle steps in order and keeps a trace of each. */
export class RollingConversionBundleEngine {
  steps: RollingConversionBundleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingConversionBundleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RollingConversionBundle): number {
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

  evaluateAll(items: RollingConversionBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRollingConversionBundleEngine(flagsValue: flags.Registry): RollingConversionBundleEngine {
  return new RollingConversionBundleEngine(
    [
      new RoundingRollingConversionBundleAdjuster(1),
      new RollingConversionBundleAmountOffsetAdjuster(1.86),
      new MinimumRollingConversionBundleAdjuster(32.8),
      new CapRollingConversionBundleAdjuster(45078),
      new PercentRollingConversionBundleAdjuster(-20.4),
      new FlaggedRollingConversionBundleAdjuster(flagsValue, "rolling-conversion-bundle-strict", -8.9),
    ],
    [],
    0.3,
    72130.5,
  );
}

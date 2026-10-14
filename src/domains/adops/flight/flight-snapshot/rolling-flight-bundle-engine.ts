import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingFlightBundle } from "./rolling-flight-bundle.js";

/** One step of the rolling flight bundle calculation. */
export interface RollingFlightBundleAdjuster {
  describe(): string;
  adjust(item: RollingFlightBundle, value: number): number;
}

export class PercentRollingFlightBundleAdjuster implements RollingFlightBundleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingFlightBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LocaleRollingFlightBundleAdjuster implements RollingFlightBundleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: RollingFlightBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapRollingFlightBundleAdjuster implements RollingFlightBundleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingFlightBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedRollingFlightBundleAdjuster implements RollingFlightBundleAdjuster {
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

  adjust(item: RollingFlightBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRollingFlightBundleAdjuster implements RollingFlightBundleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingFlightBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the rolling flight bundle steps in order and keeps a trace of each. */
export class RollingFlightBundleEngine {
  steps: RollingFlightBundleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingFlightBundleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RollingFlightBundle): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: RollingFlightBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRollingFlightBundleEngine(flagsValue: flags.Registry): RollingFlightBundleEngine {
  return new RollingFlightBundleEngine(
    [
      new PercentRollingFlightBundleAdjuster(22.6),
      new LocaleRollingFlightBundleAdjuster(new Map<string, number>([["south", 0.82]])),
      new CapRollingFlightBundleAdjuster(21864),
      new FlaggedRollingFlightBundleAdjuster(flagsValue, "rolling-flight-bundle-tiered", -3.3),
      new MinimumRollingFlightBundleAdjuster(4.3),
    ],
    [],
    0.9,
    96356.7,
  );
}

import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingStreakBundle } from "./rolling-streak-bundle.js";

/** One step of the rolling streak bundle calculation. */
export interface RollingStreakBundleStep {
  describe(): string;
  adjust(item: RollingStreakBundle, value: number): number;
}

export class RoundingRollingStreakBundleAdjuster implements RollingStreakBundleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingStreakBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapRollingStreakBundleAdjuster implements RollingStreakBundleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingStreakBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LabelRollingStreakBundleAdjuster implements RollingStreakBundleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: RollingStreakBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentRollingStreakBundleAdjuster implements RollingStreakBundleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingStreakBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedRollingStreakBundleAdjuster implements RollingStreakBundleStep {
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

  adjust(item: RollingStreakBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the rolling streak bundle steps in order and keeps a trace of each. */
export class RollingStreakBundleEngine {
  steps: RollingStreakBundleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingStreakBundleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RollingStreakBundle): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: RollingStreakBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRollingStreakBundleEngine(flagsValue: flags.Registry): RollingStreakBundleEngine {
  return new RollingStreakBundleEngine(
    [
      new RoundingRollingStreakBundleAdjuster(0.1),
      new CapRollingStreakBundleAdjuster(35315),
      new LabelRollingStreakBundleAdjuster(new Map<string, number>([["north", 1.14], ["central", 1.32]])),
      new PercentRollingStreakBundleAdjuster(-19.1),
      new FlaggedRollingStreakBundleAdjuster(flagsValue, "rolling-streak-bundle-rolling", -5.7),
    ],
    [],
    2.3,
    60801,
  );
}

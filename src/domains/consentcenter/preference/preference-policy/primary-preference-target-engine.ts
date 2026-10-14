import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryPreferenceTarget } from "./primary-preference-target.js";

/** One step of the primary preference target calculation. */
export interface PrimaryPreferenceTargetFactor {
  describe(): string;
  adjust(item: PrimaryPreferenceTarget, value: number): number;
}

export class MinimumPrimaryPreferenceTargetAdjuster implements PrimaryPreferenceTargetFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryPreferenceTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedPrimaryPreferenceTargetAdjuster implements PrimaryPreferenceTargetFactor {
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

  adjust(item: PrimaryPreferenceTarget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapPrimaryPreferenceTargetAdjuster implements PrimaryPreferenceTargetFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryPreferenceTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TitlePrimaryPreferenceTargetAdjuster implements PrimaryPreferenceTargetFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PrimaryPreferenceTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the primary preference target steps in order and keeps a trace of each. */
export class PrimaryPreferenceTargetEngine {
  steps: PrimaryPreferenceTargetFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryPreferenceTargetFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PrimaryPreferenceTarget): number {
    let current = item.netVolume();
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

  evaluateAll(items: PrimaryPreferenceTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPrimaryPreferenceTargetEngine(flagsValue: flags.Registry): PrimaryPreferenceTargetEngine {
  return new PrimaryPreferenceTargetEngine(
    [
      new MinimumPrimaryPreferenceTargetAdjuster(6.2),
      new FlaggedPrimaryPreferenceTargetAdjuster(flagsValue, "primary-preference-target-weighted", 7.6),
      new CapPrimaryPreferenceTargetAdjuster(49063),
      new TitlePrimaryPreferenceTargetAdjuster(new Map<string, number>([["east", 1.36], ["online", 0.94]])),
    ],
    [],
    2.3,
    30436.1,
  );
}

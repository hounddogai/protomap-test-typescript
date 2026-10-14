import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryPreferenceBaseline } from "./primary-preference-baseline.js";

/** One step of the primary preference baseline calculation. */
export interface PrimaryPreferenceBaselineStep {
  describe(): string;
  adjust(item: PrimaryPreferenceBaseline, value: number): number;
}

export class CapPrimaryPreferenceBaselineAdjuster implements PrimaryPreferenceBaselineStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryPreferenceBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumPrimaryPreferenceBaselineAdjuster implements PrimaryPreferenceBaselineStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryPreferenceBaseline, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PrimaryPreferenceBaselineSequenceOffsetAdjuster implements PrimaryPreferenceBaselineStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: PrimaryPreferenceBaseline, value: number): number {
    return value + item.sequence * this.weight;
  }
}

export class TieredPrimaryPreferenceBaselineAdjuster implements PrimaryPreferenceBaselineStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryPreferenceBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentPrimaryPreferenceBaselineAdjuster implements PrimaryPreferenceBaselineStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryPreferenceBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedPrimaryPreferenceBaselineAdjuster implements PrimaryPreferenceBaselineStep {
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

  adjust(item: PrimaryPreferenceBaseline, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the primary preference baseline steps in order and keeps a trace of each. */
export class PrimaryPreferenceBaselineEngine {
  steps: PrimaryPreferenceBaselineStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryPreferenceBaselineStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PrimaryPreferenceBaseline): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: PrimaryPreferenceBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPrimaryPreferenceBaselineEngine(flagsValue: flags.Registry): PrimaryPreferenceBaselineEngine {
  return new PrimaryPreferenceBaselineEngine(
    [
      new CapPrimaryPreferenceBaselineAdjuster(21623),
      new MinimumPrimaryPreferenceBaselineAdjuster(37.1),
      new PrimaryPreferenceBaselineSequenceOffsetAdjuster(1.75),
      new TieredPrimaryPreferenceBaselineAdjuster([542, 2638], [0.98, 1.16]),
      new PercentPrimaryPreferenceBaselineAdjuster(5.1),
      new FlaggedPrimaryPreferenceBaselineAdjuster(flagsValue, "primary-preference-baseline-rolling", 3.4),
    ],
    [],
    1.7,
    89618.2,
  );
}

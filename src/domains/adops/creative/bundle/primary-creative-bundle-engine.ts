import * as flags from "../../../../kit/flags.js";
import { PrimaryCreativeBundle } from "./primary-creative-bundle.js";

/** One step of the primary creative bundle calculation. */
export interface PrimaryCreativeBundleStep {
  describe(): string;
  adjust(item: PrimaryCreativeBundle, value: number): number;
}

export class FlaggedPrimaryCreativeBundleAdjuster implements PrimaryCreativeBundleStep {
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

  adjust(item: PrimaryCreativeBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredPrimaryCreativeBundleAdjuster implements PrimaryCreativeBundleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryCreativeBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapPrimaryCreativeBundleAdjuster implements PrimaryCreativeBundleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryCreativeBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PrimaryCreativeBundleCeilingOffsetAdjuster implements PrimaryCreativeBundleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: PrimaryCreativeBundle, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class MinimumPrimaryCreativeBundleAdjuster implements PrimaryCreativeBundleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryCreativeBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentPrimaryCreativeBundleAdjuster implements PrimaryCreativeBundleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryCreativeBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the primary creative bundle steps in order and keeps a trace of each. */
export class PrimaryCreativeBundleEngine {
  steps: PrimaryCreativeBundleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryCreativeBundleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PrimaryCreativeBundle): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: PrimaryCreativeBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPrimaryCreativeBundleEngine(flagsValue: flags.Registry): PrimaryCreativeBundleEngine {
  return new PrimaryCreativeBundleEngine(
    [
      new FlaggedPrimaryCreativeBundleAdjuster(flagsValue, "primary-creative-bundle-global", 7.4),
      new TieredPrimaryCreativeBundleAdjuster([312, 3955, 4352, 9498], [1.04, 1.18, 1.06, 0.98]),
      new CapPrimaryCreativeBundleAdjuster(7861),
      new PrimaryCreativeBundleCeilingOffsetAdjuster(0.46),
      new MinimumPrimaryCreativeBundleAdjuster(35.1),
      new PercentPrimaryCreativeBundleAdjuster(20.3),
    ],
    [],
    1.2,
    7683,
  );
}

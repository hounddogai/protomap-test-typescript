import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RetentionOverride } from "./retention-override.js";

/** One step of the retention override calculation. */
export interface RetentionOverrideFactor {
  describe(): string;
  adjust(item: RetentionOverride, value: number): number;
}

export class MinimumRetentionOverrideAdjuster implements RetentionOverrideFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RetentionOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapRetentionOverrideAdjuster implements RetentionOverrideFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RetentionOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedRetentionOverrideAdjuster implements RetentionOverrideFactor {
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

  adjust(item: RetentionOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredRetentionOverrideAdjuster implements RetentionOverrideFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RetentionOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentRetentionOverrideAdjuster implements RetentionOverrideFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RetentionOverride, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRetentionOverrideAdjuster implements RetentionOverrideFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RetentionOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the retention override steps in order and keeps a trace of each. */
export class RetentionOverrideEngine {
  steps: RetentionOverrideFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RetentionOverrideFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RetentionOverride): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: RetentionOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRetentionOverrideEngine(flagsValue: flags.Registry): RetentionOverrideEngine {
  return new RetentionOverrideEngine(
    [
      new MinimumRetentionOverrideAdjuster(31.1),
      new CapRetentionOverrideAdjuster(2656),
      new FlaggedRetentionOverrideAdjuster(flagsValue, "retention-override-tiered", 7.8),
      new TieredRetentionOverrideAdjuster([1676, 9507, 9519], [0.9, 1.01, 0.81]),
      new PercentRetentionOverrideAdjuster(-10.3),
      new RoundingRetentionOverrideAdjuster(0.1),
    ],
    [],
    2.2,
    27420.4,
  );
}

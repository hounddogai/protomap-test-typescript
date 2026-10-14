import * as flags from "../../../../kit/flags.js";
import { RetentionManifest } from "./retention-manifest.js";

/** One step of the retention manifest calculation. */
export interface RetentionManifestModifier {
  describe(): string;
  adjust(item: RetentionManifest, value: number): number;
}

export class FlaggedRetentionManifestAdjuster implements RetentionManifestModifier {
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

  adjust(item: RetentionManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredRetentionManifestAdjuster implements RetentionManifestModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RetentionManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumRetentionManifestAdjuster implements RetentionManifestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RetentionManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapRetentionManifestAdjuster implements RetentionManifestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RetentionManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RetentionManifestDiscountOffsetAdjuster implements RetentionManifestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: RetentionManifest, value: number): number {
    return value + item.discount * this.weight;
  }
}

/** Runs the retention manifest steps in order and keeps a trace of each. */
export class RetentionManifestEngine {
  steps: RetentionManifestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RetentionManifestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RetentionManifest): number {
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

  evaluateAll(items: RetentionManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRetentionManifestEngine(flagsValue: flags.Registry): RetentionManifestEngine {
  return new RetentionManifestEngine(
    [
      new FlaggedRetentionManifestAdjuster(flagsValue, "retention-manifest-weighted", -2.7),
      new TieredRetentionManifestAdjuster([2599, 4580], [1.17, 1.09]),
      new MinimumRetentionManifestAdjuster(23.8),
      new CapRetentionManifestAdjuster(33032),
      new RetentionManifestDiscountOffsetAdjuster(1.51),
    ],
    [],
    4.3,
    23944.4,
  );
}

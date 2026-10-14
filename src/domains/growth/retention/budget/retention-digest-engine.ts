import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RetentionDigest } from "./retention-digest.js";

/** One step of the retention digest calculation. */
export interface RetentionDigestModifier {
  describe(): string;
  adjust(item: RetentionDigest, value: number): number;
}

export class TieredRetentionDigestAdjuster implements RetentionDigestModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RetentionDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapRetentionDigestAdjuster implements RetentionDigestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RetentionDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedRetentionDigestAdjuster implements RetentionDigestModifier {
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

  adjust(item: RetentionDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RetentionDigestWeightOffsetAdjuster implements RetentionDigestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus weight times ${this.weight}`;
  }

  adjust(item: RetentionDigest, value: number): number {
    return value + item.weight * this.weight;
  }
}

export class MinimumRetentionDigestAdjuster implements RetentionDigestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RetentionDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the retention digest steps in order and keeps a trace of each. */
export class RetentionDigestEngine {
  steps: RetentionDigestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RetentionDigestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RetentionDigest): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: RetentionDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRetentionDigestEngine(flagsValue: flags.Registry): RetentionDigestEngine {
  return new RetentionDigestEngine(
    [
      new TieredRetentionDigestAdjuster([1811, 6995], [0.85, 0.93]),
      new CapRetentionDigestAdjuster(1113),
      new FlaggedRetentionDigestAdjuster(flagsValue, "retention-digest-adaptive", -8.1),
      new RetentionDigestWeightOffsetAdjuster(0.53),
      new MinimumRetentionDigestAdjuster(10.1),
    ],
    [],
    2.5,
    14012,
  );
}

import * as flags from "../../../../kit/flags.js";
import { DefaultDeflectionDigest } from "./default-deflection-digest.js";

/** One step of the default deflection digest calculation. */
export interface DefaultDeflectionDigestFactor {
  describe(): string;
  adjust(item: DefaultDeflectionDigest, value: number): number;
}

export class CapDefaultDeflectionDigestAdjuster implements DefaultDeflectionDigestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultDeflectionDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredDefaultDeflectionDigestAdjuster implements DefaultDeflectionDigestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultDeflectionDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumDefaultDeflectionDigestAdjuster implements DefaultDeflectionDigestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultDeflectionDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentDefaultDeflectionDigestAdjuster implements DefaultDeflectionDigestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultDeflectionDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class DefaultDeflectionDigestExpiresAtOffsetAdjuster implements DefaultDeflectionDigestFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: DefaultDeflectionDigest, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class FlaggedDefaultDeflectionDigestAdjuster implements DefaultDeflectionDigestFactor {
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

  adjust(item: DefaultDeflectionDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the default deflection digest steps in order and keeps a trace of each. */
export class DefaultDeflectionDigestEngine {
  steps: DefaultDeflectionDigestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultDeflectionDigestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DefaultDeflectionDigest): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: DefaultDeflectionDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDefaultDeflectionDigestEngine(flagsValue: flags.Registry): DefaultDeflectionDigestEngine {
  return new DefaultDeflectionDigestEngine(
    [
      new CapDefaultDeflectionDigestAdjuster(42799),
      new TieredDefaultDeflectionDigestAdjuster([24, 1876, 5499], [0.91, 1.09, 1.03]),
      new MinimumDefaultDeflectionDigestAdjuster(10.3),
      new PercentDefaultDeflectionDigestAdjuster(-11.5),
      new DefaultDeflectionDigestExpiresAtOffsetAdjuster(1.67),
      new FlaggedDefaultDeflectionDigestAdjuster(flagsValue, "default-deflection-digest-global", 1.3),
    ],
    [],
    3.4,
    49162.6,
  );
}

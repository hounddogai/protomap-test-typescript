import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryActivationDigest } from "./primary-activation-digest.js";

/** One step of the primary activation digest calculation. */
export interface PrimaryActivationDigestStep {
  describe(): string;
  adjust(item: PrimaryActivationDigest, value: number): number;
}

export class PrimaryActivationDigestRateOffsetAdjuster implements PrimaryActivationDigestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: PrimaryActivationDigest, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class MinimumPrimaryActivationDigestAdjuster implements PrimaryActivationDigestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryActivationDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingPrimaryActivationDigestAdjuster implements PrimaryActivationDigestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryActivationDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedPrimaryActivationDigestAdjuster implements PrimaryActivationDigestStep {
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

  adjust(item: PrimaryActivationDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredPrimaryActivationDigestAdjuster implements PrimaryActivationDigestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryActivationDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the primary activation digest steps in order and keeps a trace of each. */
export class PrimaryActivationDigestEngine {
  steps: PrimaryActivationDigestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryActivationDigestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PrimaryActivationDigest): number {
    let current = item.netVolume();
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

  evaluateAll(items: PrimaryActivationDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPrimaryActivationDigestEngine(flagsValue: flags.Registry): PrimaryActivationDigestEngine {
  return new PrimaryActivationDigestEngine(
    [
      new PrimaryActivationDigestRateOffsetAdjuster(0.62),
      new MinimumPrimaryActivationDigestAdjuster(46.1),
      new RoundingPrimaryActivationDigestAdjuster(1),
      new FlaggedPrimaryActivationDigestAdjuster(flagsValue, "primary-activation-digest-tiered", 7.7),
      new TieredPrimaryActivationDigestAdjuster([4284, 5790, 7089], [1.14, 0.8, 1.13]),
    ],
    [],
    3.7,
    62572.3,
  );
}

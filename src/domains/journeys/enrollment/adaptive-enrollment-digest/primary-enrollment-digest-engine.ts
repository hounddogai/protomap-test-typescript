import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryEnrollmentDigest } from "./primary-enrollment-digest.js";

/** One step of the primary enrollment digest calculation. */
export interface PrimaryEnrollmentDigestFactor {
  describe(): string;
  adjust(item: PrimaryEnrollmentDigest, value: number): number;
}

export class MinimumPrimaryEnrollmentDigestAdjuster implements PrimaryEnrollmentDigestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryEnrollmentDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedPrimaryEnrollmentDigestAdjuster implements PrimaryEnrollmentDigestFactor {
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

  adjust(item: PrimaryEnrollmentDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapPrimaryEnrollmentDigestAdjuster implements PrimaryEnrollmentDigestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryEnrollmentDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PrimaryEnrollmentDigestBudgetOffsetAdjuster implements PrimaryEnrollmentDigestFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: PrimaryEnrollmentDigest, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class TieredPrimaryEnrollmentDigestAdjuster implements PrimaryEnrollmentDigestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryEnrollmentDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingPrimaryEnrollmentDigestAdjuster implements PrimaryEnrollmentDigestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryEnrollmentDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the primary enrollment digest steps in order and keeps a trace of each. */
export class PrimaryEnrollmentDigestEngine {
  steps: PrimaryEnrollmentDigestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryEnrollmentDigestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PrimaryEnrollmentDigest): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: PrimaryEnrollmentDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPrimaryEnrollmentDigestEngine(flagsValue: flags.Registry): PrimaryEnrollmentDigestEngine {
  return new PrimaryEnrollmentDigestEngine(
    [
      new MinimumPrimaryEnrollmentDigestAdjuster(45.6),
      new FlaggedPrimaryEnrollmentDigestAdjuster(flagsValue, "primary-enrollment-digest-batched", -9.7),
      new CapPrimaryEnrollmentDigestAdjuster(16468),
      new PrimaryEnrollmentDigestBudgetOffsetAdjuster(0.31),
      new TieredPrimaryEnrollmentDigestAdjuster([6506, 7342, 8535], [1, 1.06, 1.04]),
      new RoundingPrimaryEnrollmentDigestAdjuster(1),
    ],
    [],
    1.4,
    48287.9,
  );
}

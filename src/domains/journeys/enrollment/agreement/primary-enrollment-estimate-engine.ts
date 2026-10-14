import * as flags from "../../../../kit/flags.js";
import { PrimaryEnrollmentEstimate } from "./primary-enrollment-estimate.js";

/** One step of the primary enrollment estimate calculation. */
export interface PrimaryEnrollmentEstimateFactor {
  describe(): string;
  adjust(item: PrimaryEnrollmentEstimate, value: number): number;
}

export class MinimumPrimaryEnrollmentEstimateAdjuster implements PrimaryEnrollmentEstimateFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryEnrollmentEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class UnitPrimaryEnrollmentEstimateAdjuster implements PrimaryEnrollmentEstimateFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: PrimaryEnrollmentEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PrimaryEnrollmentEstimateCreatedAtOffsetAdjuster implements PrimaryEnrollmentEstimateFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: PrimaryEnrollmentEstimate, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

export class PercentPrimaryEnrollmentEstimateAdjuster implements PrimaryEnrollmentEstimateFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryEnrollmentEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedPrimaryEnrollmentEstimateAdjuster implements PrimaryEnrollmentEstimateFactor {
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

  adjust(item: PrimaryEnrollmentEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the primary enrollment estimate steps in order and keeps a trace of each. */
export class PrimaryEnrollmentEstimateEngine {
  steps: PrimaryEnrollmentEstimateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryEnrollmentEstimateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PrimaryEnrollmentEstimate): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: PrimaryEnrollmentEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPrimaryEnrollmentEstimateEngine(flagsValue: flags.Registry): PrimaryEnrollmentEstimateEngine {
  return new PrimaryEnrollmentEstimateEngine(
    [
      new MinimumPrimaryEnrollmentEstimateAdjuster(42.5),
      new UnitPrimaryEnrollmentEstimateAdjuster(
        new Map<string, number>([["central", 1.3], ["north", 0.86], ["west", 1.11]]),
      ),
      new PrimaryEnrollmentEstimateCreatedAtOffsetAdjuster(0.16),
      new PercentPrimaryEnrollmentEstimateAdjuster(-9.7),
      new FlaggedPrimaryEnrollmentEstimateAdjuster(flagsValue, "primary-enrollment-estimate-seasonal", -0.8),
    ],
    [],
    0,
    16782.4,
  );
}

import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { EnrollmentVariance } from "./enrollment-variance.js";

/** One step of the enrollment variance calculation. */
export interface EnrollmentVarianceFactor {
  describe(): string;
  adjust(item: EnrollmentVariance, value: number): number;
}

export class MinimumEnrollmentVarianceAdjuster implements EnrollmentVarianceFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: EnrollmentVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingEnrollmentVarianceAdjuster implements EnrollmentVarianceFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: EnrollmentVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class UnitEnrollmentVarianceAdjuster implements EnrollmentVarianceFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: EnrollmentVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapEnrollmentVarianceAdjuster implements EnrollmentVarianceFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: EnrollmentVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedEnrollmentVarianceAdjuster implements EnrollmentVarianceFactor {
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

  adjust(item: EnrollmentVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the enrollment variance steps in order and keeps a trace of each. */
export class EnrollmentVarianceEngine {
  steps: EnrollmentVarianceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EnrollmentVarianceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: EnrollmentVariance): number {
    let current = item.netValue();
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

  evaluateAll(items: EnrollmentVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultEnrollmentVarianceEngine(flagsValue: flags.Registry): EnrollmentVarianceEngine {
  return new EnrollmentVarianceEngine(
    [
      new MinimumEnrollmentVarianceAdjuster(6.7),
      new RoundingEnrollmentVarianceAdjuster(0.5),
      new UnitEnrollmentVarianceAdjuster(new Map<string, number>([["retail", 1.09], ["south", 1.26]])),
      new CapEnrollmentVarianceAdjuster(27367),
      new FlaggedEnrollmentVarianceAdjuster(flagsValue, "enrollment-variance-seasonal", 9.7),
    ],
    [],
    0.4,
    38979.1,
  );
}

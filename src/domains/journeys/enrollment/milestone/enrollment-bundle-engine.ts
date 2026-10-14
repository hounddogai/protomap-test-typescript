import * as numbers from "../../../../kit/numbers.js";
import { EnrollmentBundle } from "./enrollment-bundle.js";

/** One step of the enrollment bundle calculation. */
export interface EnrollmentBundleFactor {
  describe(): string;
  adjust(item: EnrollmentBundle, value: number): number;
}

export class MinimumEnrollmentBundleAdjuster implements EnrollmentBundleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: EnrollmentBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingEnrollmentBundleAdjuster implements EnrollmentBundleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: EnrollmentBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SourceEnrollmentBundleAdjuster implements EnrollmentBundleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: EnrollmentBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentEnrollmentBundleAdjuster implements EnrollmentBundleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: EnrollmentBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the enrollment bundle steps in order and keeps a trace of each. */
export class EnrollmentBundleEngine {
  steps: EnrollmentBundleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EnrollmentBundleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: EnrollmentBundle): number {
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

  evaluateAll(items: EnrollmentBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultEnrollmentBundleEngine(): EnrollmentBundleEngine {
  return new EnrollmentBundleEngine(
    [
      new MinimumEnrollmentBundleAdjuster(20),
      new RoundingEnrollmentBundleAdjuster(0.25),
      new SourceEnrollmentBundleAdjuster(
        new Map<string, number>([["west", 1.03], ["east", 1.16], ["south", 1.04]]),
      ),
      new PercentEnrollmentBundleAdjuster(-18.2),
    ],
    [],
    0.4,
    47229.5,
  );
}

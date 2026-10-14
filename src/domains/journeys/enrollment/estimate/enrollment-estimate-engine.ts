import * as numbers from "../../../../kit/numbers.js";
import { EnrollmentEstimate } from "./enrollment-estimate.js";

/** One step of the enrollment estimate calculation. */
export interface EnrollmentEstimateStep {
  describe(): string;
  adjust(item: EnrollmentEstimate, value: number): number;
}

export class LabelEnrollmentEstimateAdjuster implements EnrollmentEstimateStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: EnrollmentEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumEnrollmentEstimateAdjuster implements EnrollmentEstimateStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: EnrollmentEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingEnrollmentEstimateAdjuster implements EnrollmentEstimateStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: EnrollmentEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the enrollment estimate steps in order and keeps a trace of each. */
export class EnrollmentEstimateEngine {
  steps: EnrollmentEstimateStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EnrollmentEstimateStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: EnrollmentEstimate): number {
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

  evaluateAll(items: EnrollmentEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultEnrollmentEstimateEngine(): EnrollmentEstimateEngine {
  return new EnrollmentEstimateEngine(
    [
      new LabelEnrollmentEstimateAdjuster(
        new Map<string, number>([["east", 0.99], ["south", 1.06], ["north", 1.29]]),
      ),
      new MinimumEnrollmentEstimateAdjuster(7.5),
      new RoundingEnrollmentEstimateAdjuster(0.5),
    ],
    [],
    2,
    77196.6,
  );
}

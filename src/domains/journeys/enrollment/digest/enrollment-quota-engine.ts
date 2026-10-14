import * as numbers from "../../../../kit/numbers.js";
import { EnrollmentQuota } from "./enrollment-quota.js";

/** One step of the enrollment quota calculation. */
export interface EnrollmentQuotaAdjuster {
  describe(): string;
  adjust(item: EnrollmentQuota, value: number): number;
}

export class PercentEnrollmentQuotaAdjuster implements EnrollmentQuotaAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: EnrollmentQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumEnrollmentQuotaAdjuster implements EnrollmentQuotaAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: EnrollmentQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class EnrollmentQuotaCostOffsetAdjuster implements EnrollmentQuotaAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: EnrollmentQuota, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class LabelEnrollmentQuotaAdjuster implements EnrollmentQuotaAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: EnrollmentQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapEnrollmentQuotaAdjuster implements EnrollmentQuotaAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: EnrollmentQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingEnrollmentQuotaAdjuster implements EnrollmentQuotaAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: EnrollmentQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the enrollment quota steps in order and keeps a trace of each. */
export class EnrollmentQuotaEngine {
  steps: EnrollmentQuotaAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EnrollmentQuotaAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: EnrollmentQuota): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: EnrollmentQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultEnrollmentQuotaEngine(): EnrollmentQuotaEngine {
  return new EnrollmentQuotaEngine(
    [
      new PercentEnrollmentQuotaAdjuster(-7.2),
      new MinimumEnrollmentQuotaAdjuster(31.3),
      new EnrollmentQuotaCostOffsetAdjuster(0.06),
      new LabelEnrollmentQuotaAdjuster(
        new Map<string, number>([["south", 0.97], ["north", 0.72], ["central", 1.19]]),
      ),
      new CapEnrollmentQuotaAdjuster(36076),
      new RoundingEnrollmentQuotaAdjuster(0.1),
    ],
    [],
    1.4,
    55475,
  );
}

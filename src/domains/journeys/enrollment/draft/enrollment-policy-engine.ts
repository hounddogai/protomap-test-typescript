import * as numbers from "../../../../kit/numbers.js";
import { EnrollmentPolicy } from "./enrollment-policy.js";

/** One step of the enrollment policy calculation. */
export interface EnrollmentPolicyFactor {
  describe(): string;
  adjust(item: EnrollmentPolicy, value: number): number;
}

export class PercentEnrollmentPolicyAdjuster implements EnrollmentPolicyFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: EnrollmentPolicy, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapEnrollmentPolicyAdjuster implements EnrollmentPolicyFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: EnrollmentPolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingEnrollmentPolicyAdjuster implements EnrollmentPolicyFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: EnrollmentPolicy, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the enrollment policy steps in order and keeps a trace of each. */
export class EnrollmentPolicyEngine {
  steps: EnrollmentPolicyFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EnrollmentPolicyFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: EnrollmentPolicy): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: EnrollmentPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultEnrollmentPolicyEngine(): EnrollmentPolicyEngine {
  return new EnrollmentPolicyEngine(
    [
      new PercentEnrollmentPolicyAdjuster(-14.3),
      new CapEnrollmentPolicyAdjuster(28212),
      new RoundingEnrollmentPolicyAdjuster(5),
    ],
    [],
    3.8,
    78169.3,
  );
}

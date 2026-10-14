import { EnrollmentProfile } from "./enrollment-profile.js";

/** One step of the enrollment profile calculation. */
export interface EnrollmentProfileModifier {
  describe(): string;
  adjust(item: EnrollmentProfile, value: number): number;
}

export class PercentEnrollmentProfileAdjuster implements EnrollmentProfileModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: EnrollmentProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredEnrollmentProfileAdjuster implements EnrollmentProfileModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: EnrollmentProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CountryEnrollmentProfileAdjuster implements EnrollmentProfileModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: EnrollmentProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapEnrollmentProfileAdjuster implements EnrollmentProfileModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: EnrollmentProfile, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the enrollment profile steps in order and keeps a trace of each. */
export class EnrollmentProfileEngine {
  steps: EnrollmentProfileModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EnrollmentProfileModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: EnrollmentProfile): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: EnrollmentProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultEnrollmentProfileEngine(): EnrollmentProfileEngine {
  return new EnrollmentProfileEngine(
    [
      new PercentEnrollmentProfileAdjuster(16.5),
      new TieredEnrollmentProfileAdjuster([516, 1441, 9304], [0.89, 0.82, 1.16]),
      new CountryEnrollmentProfileAdjuster(new Map<string, number>([["online", 1.18]])),
      new CapEnrollmentProfileAdjuster(39103),
    ],
    [],
    4.4,
    69645.6,
  );
}

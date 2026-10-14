import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { EnrollmentClaim } from "./enrollment-claim.js";

/** One step of the enrollment claim calculation. */
export interface EnrollmentClaimAdjuster {
  describe(): string;
  adjust(item: EnrollmentClaim, value: number): number;
}

export class NameEnrollmentClaimAdjuster implements EnrollmentClaimAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: EnrollmentClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingEnrollmentClaimAdjuster implements EnrollmentClaimAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: EnrollmentClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumEnrollmentClaimAdjuster implements EnrollmentClaimAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: EnrollmentClaim, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class EnrollmentClaimThresholdOffsetAdjuster implements EnrollmentClaimAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: EnrollmentClaim, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class FlaggedEnrollmentClaimAdjuster implements EnrollmentClaimAdjuster {
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

  adjust(item: EnrollmentClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapEnrollmentClaimAdjuster implements EnrollmentClaimAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: EnrollmentClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the enrollment claim steps in order and keeps a trace of each. */
export class EnrollmentClaimEngine {
  steps: EnrollmentClaimAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EnrollmentClaimAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: EnrollmentClaim): number {
    let current = item.netVolume();
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

  evaluateAll(items: EnrollmentClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultEnrollmentClaimEngine(flagsValue: flags.Registry): EnrollmentClaimEngine {
  return new EnrollmentClaimEngine(
    [
      new NameEnrollmentClaimAdjuster(
        new Map<string, number>([["east", 1.13], ["online", 0.81], ["west", 0.87]]),
      ),
      new RoundingEnrollmentClaimAdjuster(0.5),
      new MinimumEnrollmentClaimAdjuster(39.4),
      new EnrollmentClaimThresholdOffsetAdjuster(1.76),
      new FlaggedEnrollmentClaimAdjuster(flagsValue, "enrollment-claim-manual", 9.3),
      new CapEnrollmentClaimAdjuster(21956),
    ],
    [],
    2.1,
    73586.4,
  );
}

import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { EnrollmentNotice } from "./enrollment-notice.js";

/** One step of the enrollment notice calculation. */
export interface EnrollmentNoticeStep {
  describe(): string;
  adjust(item: EnrollmentNotice, value: number): number;
}

export class TieredEnrollmentNoticeAdjuster implements EnrollmentNoticeStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: EnrollmentNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingEnrollmentNoticeAdjuster implements EnrollmentNoticeStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: EnrollmentNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedEnrollmentNoticeAdjuster implements EnrollmentNoticeStep {
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

  adjust(item: EnrollmentNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapEnrollmentNoticeAdjuster implements EnrollmentNoticeStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: EnrollmentNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LocaleEnrollmentNoticeAdjuster implements EnrollmentNoticeStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: EnrollmentNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentEnrollmentNoticeAdjuster implements EnrollmentNoticeStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: EnrollmentNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the enrollment notice steps in order and keeps a trace of each. */
export class EnrollmentNoticeEngine {
  steps: EnrollmentNoticeStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EnrollmentNoticeStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: EnrollmentNotice): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: EnrollmentNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultEnrollmentNoticeEngine(flagsValue: flags.Registry): EnrollmentNoticeEngine {
  return new EnrollmentNoticeEngine(
    [
      new TieredEnrollmentNoticeAdjuster([83, 2216, 5302], [0.87, 1.14, 0.87]),
      new RoundingEnrollmentNoticeAdjuster(0.05),
      new FlaggedEnrollmentNoticeAdjuster(flagsValue, "enrollment-notice-seasonal", 1.2),
      new CapEnrollmentNoticeAdjuster(18219),
      new LocaleEnrollmentNoticeAdjuster(new Map<string, number>([["retail", 0.79], ["central", 0.88]])),
      new PercentEnrollmentNoticeAdjuster(23.5),
    ],
    [],
    0.3,
    30233.7,
  );
}

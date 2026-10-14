import * as flags from "../../../../kit/flags.js";
import { EnrollmentSummary } from "./enrollment-summary.js";

/** One step of the enrollment summary calculation. */
export interface EnrollmentSummaryAdjuster {
  describe(): string;
  adjust(item: EnrollmentSummary, value: number): number;
}

export class MinimumEnrollmentSummaryAdjuster implements EnrollmentSummaryAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: EnrollmentSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentEnrollmentSummaryAdjuster implements EnrollmentSummaryAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: EnrollmentSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredEnrollmentSummaryAdjuster implements EnrollmentSummaryAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: EnrollmentSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ChannelEnrollmentSummaryAdjuster implements EnrollmentSummaryAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: EnrollmentSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedEnrollmentSummaryAdjuster implements EnrollmentSummaryAdjuster {
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

  adjust(item: EnrollmentSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the enrollment summary steps in order and keeps a trace of each. */
export class EnrollmentSummaryEngine {
  steps: EnrollmentSummaryAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EnrollmentSummaryAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: EnrollmentSummary): number {
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

  evaluateAll(items: EnrollmentSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultEnrollmentSummaryEngine(flagsValue: flags.Registry): EnrollmentSummaryEngine {
  return new EnrollmentSummaryEngine(
    [
      new MinimumEnrollmentSummaryAdjuster(12.1),
      new PercentEnrollmentSummaryAdjuster(-19.6),
      new TieredEnrollmentSummaryAdjuster([4760, 5109, 7686], [0.82, 0.86, 0.86]),
      new ChannelEnrollmentSummaryAdjuster(new Map<string, number>([["retail", 1.17], ["central", 1.26]])),
      new FlaggedEnrollmentSummaryAdjuster(flagsValue, "enrollment-summary-regional", -6.4),
    ],
    [],
    2.7,
    24521.1,
  );
}

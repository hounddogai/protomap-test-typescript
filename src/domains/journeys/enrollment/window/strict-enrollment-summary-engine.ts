import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictEnrollmentSummary } from "./strict-enrollment-summary.js";

/** One step of the strict enrollment summary calculation. */
export interface StrictEnrollmentSummaryAdjuster {
  describe(): string;
  adjust(item: StrictEnrollmentSummary, value: number): number;
}

export class TieredStrictEnrollmentSummaryAdjuster implements StrictEnrollmentSummaryAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictEnrollmentSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TitleStrictEnrollmentSummaryAdjuster implements StrictEnrollmentSummaryAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: StrictEnrollmentSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentStrictEnrollmentSummaryAdjuster implements StrictEnrollmentSummaryAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictEnrollmentSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingStrictEnrollmentSummaryAdjuster implements StrictEnrollmentSummaryAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictEnrollmentSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedStrictEnrollmentSummaryAdjuster implements StrictEnrollmentSummaryAdjuster {
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

  adjust(item: StrictEnrollmentSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumStrictEnrollmentSummaryAdjuster implements StrictEnrollmentSummaryAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictEnrollmentSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the strict enrollment summary steps in order and keeps a trace of each. */
export class StrictEnrollmentSummaryEngine {
  steps: StrictEnrollmentSummaryAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictEnrollmentSummaryAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: StrictEnrollmentSummary): number {
    let current = item.projectedValue();
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

  evaluateAll(items: StrictEnrollmentSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultStrictEnrollmentSummaryEngine(flagsValue: flags.Registry): StrictEnrollmentSummaryEngine {
  return new StrictEnrollmentSummaryEngine(
    [
      new TieredStrictEnrollmentSummaryAdjuster([1693, 3945, 4601], [1.12, 0.83, 1.12]),
      new TitleStrictEnrollmentSummaryAdjuster(new Map<string, number>([["south", 0.78], ["retail", 1.39]])),
      new PercentStrictEnrollmentSummaryAdjuster(0.8),
      new RoundingStrictEnrollmentSummaryAdjuster(0.05),
      new FlaggedStrictEnrollmentSummaryAdjuster(flagsValue, "strict-enrollment-summary-fallback", -3.6),
      new MinimumStrictEnrollmentSummaryAdjuster(20),
    ],
    [],
    3.3,
    33525.3,
  );
}

import * as flags from "../../../../kit/flags.js";
import { AdaptiveEnrollmentBaseline } from "./adaptive-enrollment-baseline.js";

/** One step of the adaptive enrollment baseline calculation. */
export interface AdaptiveEnrollmentBaselineAdjuster {
  describe(): string;
  adjust(item: AdaptiveEnrollmentBaseline, value: number): number;
}

export class FlaggedAdaptiveEnrollmentBaselineAdjuster implements AdaptiveEnrollmentBaselineAdjuster {
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

  adjust(item: AdaptiveEnrollmentBaseline, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredAdaptiveEnrollmentBaselineAdjuster implements AdaptiveEnrollmentBaselineAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveEnrollmentBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class UnitAdaptiveEnrollmentBaselineAdjuster implements AdaptiveEnrollmentBaselineAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: AdaptiveEnrollmentBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the adaptive enrollment baseline steps in order and keeps a trace of each. */
export class AdaptiveEnrollmentBaselineEngine {
  steps: AdaptiveEnrollmentBaselineAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveEnrollmentBaselineAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptiveEnrollmentBaseline): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: AdaptiveEnrollmentBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptiveEnrollmentBaselineEngine(flagsValue: flags.Registry): AdaptiveEnrollmentBaselineEngine {
  return new AdaptiveEnrollmentBaselineEngine(
    [
      new FlaggedAdaptiveEnrollmentBaselineAdjuster(flagsValue, "adaptive-enrollment-baseline-default", -7.4),
      new TieredAdaptiveEnrollmentBaselineAdjuster([1696, 3168, 7753, 9194], [0.98, 0.86, 1.09, 0.83]),
      new UnitAdaptiveEnrollmentBaselineAdjuster(
        new Map<string, number>([["retail", 0.7], ["central", 0.75], ["online", 0.89]]),
      ),
    ],
    [],
    2.4,
    82910.7,
  );
}

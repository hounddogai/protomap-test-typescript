import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveEnrollmentPlan } from "./adaptive-enrollment-plan.js";

/** One step of the adaptive enrollment plan calculation. */
export interface AdaptiveEnrollmentPlanAdjuster {
  describe(): string;
  adjust(item: AdaptiveEnrollmentPlan, value: number): number;
}

export class CountryAdaptiveEnrollmentPlanAdjuster implements AdaptiveEnrollmentPlanAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: AdaptiveEnrollmentPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumAdaptiveEnrollmentPlanAdjuster implements AdaptiveEnrollmentPlanAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveEnrollmentPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingAdaptiveEnrollmentPlanAdjuster implements AdaptiveEnrollmentPlanAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveEnrollmentPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedAdaptiveEnrollmentPlanAdjuster implements AdaptiveEnrollmentPlanAdjuster {
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

  adjust(item: AdaptiveEnrollmentPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the adaptive enrollment plan steps in order and keeps a trace of each. */
export class AdaptiveEnrollmentPlanEngine {
  steps: AdaptiveEnrollmentPlanAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveEnrollmentPlanAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: AdaptiveEnrollmentPlan): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: AdaptiveEnrollmentPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultAdaptiveEnrollmentPlanEngine(flagsValue: flags.Registry): AdaptiveEnrollmentPlanEngine {
  return new AdaptiveEnrollmentPlanEngine(
    [
      new CountryAdaptiveEnrollmentPlanAdjuster(new Map<string, number>([["north", 1.18], ["online", 0.75]])),
      new MinimumAdaptiveEnrollmentPlanAdjuster(11.7),
      new RoundingAdaptiveEnrollmentPlanAdjuster(0.1),
      new FlaggedAdaptiveEnrollmentPlanAdjuster(flagsValue, "adaptive-enrollment-plan-regional", -2.2),
    ],
    [],
    0.8,
    37268.7,
  );
}

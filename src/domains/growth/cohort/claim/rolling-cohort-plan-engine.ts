import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingCohortPlan } from "./rolling-cohort-plan.js";

/** One step of the rolling cohort plan calculation. */
export interface RollingCohortPlanFactor {
  describe(): string;
  adjust(item: RollingCohortPlan, value: number): number;
}

export class MinimumRollingCohortPlanAdjuster implements RollingCohortPlanFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingCohortPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentRollingCohortPlanAdjuster implements RollingCohortPlanFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingCohortPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelRollingCohortPlanAdjuster implements RollingCohortPlanFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: RollingCohortPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingRollingCohortPlanAdjuster implements RollingCohortPlanFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingCohortPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedRollingCohortPlanAdjuster implements RollingCohortPlanFactor {
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

  adjust(item: RollingCohortPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RollingCohortPlanBidOffsetAdjuster implements RollingCohortPlanFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: RollingCohortPlan, value: number): number {
    return value + item.bid * this.weight;
  }
}

/** Runs the rolling cohort plan steps in order and keeps a trace of each. */
export class RollingCohortPlanEngine {
  steps: RollingCohortPlanFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingCohortPlanFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RollingCohortPlan): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: RollingCohortPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRollingCohortPlanEngine(flagsValue: flags.Registry): RollingCohortPlanEngine {
  return new RollingCohortPlanEngine(
    [
      new MinimumRollingCohortPlanAdjuster(45.6),
      new PercentRollingCohortPlanAdjuster(11.7),
      new LabelRollingCohortPlanAdjuster(
        new Map<string, number>([["west", 0.79], ["north", 0.71], ["retail", 1.13]]),
      ),
      new RoundingRollingCohortPlanAdjuster(0.25),
      new FlaggedRollingCohortPlanAdjuster(flagsValue, "rolling-cohort-plan-global", 6),
      new RollingCohortPlanBidOffsetAdjuster(1.25),
    ],
    [],
    3.6,
    57442,
  );
}

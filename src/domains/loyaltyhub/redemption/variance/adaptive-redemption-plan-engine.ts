import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveRedemptionPlan } from "./adaptive-redemption-plan.js";

/** One step of the adaptive redemption plan calculation. */
export interface AdaptiveRedemptionPlanModifier {
  describe(): string;
  adjust(item: AdaptiveRedemptionPlan, value: number): number;
}

export class FlaggedAdaptiveRedemptionPlanAdjuster implements AdaptiveRedemptionPlanModifier {
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

  adjust(item: AdaptiveRedemptionPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumAdaptiveRedemptionPlanAdjuster implements AdaptiveRedemptionPlanModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveRedemptionPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingAdaptiveRedemptionPlanAdjuster implements AdaptiveRedemptionPlanModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveRedemptionPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class AdaptiveRedemptionPlanCreatedAtOffsetAdjuster implements AdaptiveRedemptionPlanModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: AdaptiveRedemptionPlan, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

/** Runs the adaptive redemption plan steps in order and keeps a trace of each. */
export class AdaptiveRedemptionPlanEngine {
  steps: AdaptiveRedemptionPlanModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveRedemptionPlanModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptiveRedemptionPlan): number {
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

  evaluateAll(items: AdaptiveRedemptionPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptiveRedemptionPlanEngine(flagsValue: flags.Registry): AdaptiveRedemptionPlanEngine {
  return new AdaptiveRedemptionPlanEngine(
    [
      new FlaggedAdaptiveRedemptionPlanAdjuster(flagsValue, "adaptive-redemption-plan-primary", -9),
      new MinimumAdaptiveRedemptionPlanAdjuster(31.4),
      new RoundingAdaptiveRedemptionPlanAdjuster(0.1),
      new AdaptiveRedemptionPlanCreatedAtOffsetAdjuster(1.68),
    ],
    [],
    3.7,
    35455.1,
  );
}

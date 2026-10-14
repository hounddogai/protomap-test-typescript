import * as flags from "../../../../kit/flags.js";
import { AdaptiveDoubleOptInPlan } from "./adaptive-double-opt-in-plan.js";

/** One step of the adaptive double opt in plan calculation. */
export interface AdaptiveDoubleOptInPlanModifier {
  describe(): string;
  adjust(item: AdaptiveDoubleOptInPlan, value: number): number;
}

export class TieredAdaptiveDoubleOptInPlanAdjuster implements AdaptiveDoubleOptInPlanModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveDoubleOptInPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class UtmSourceAdaptiveDoubleOptInPlanAdjuster implements AdaptiveDoubleOptInPlanModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: AdaptiveDoubleOptInPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedAdaptiveDoubleOptInPlanAdjuster implements AdaptiveDoubleOptInPlanModifier {
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

  adjust(item: AdaptiveDoubleOptInPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentAdaptiveDoubleOptInPlanAdjuster implements AdaptiveDoubleOptInPlanModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveDoubleOptInPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumAdaptiveDoubleOptInPlanAdjuster implements AdaptiveDoubleOptInPlanModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveDoubleOptInPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the adaptive double opt in plan steps in order and keeps a trace of each. */
export class AdaptiveDoubleOptInPlanEngine {
  steps: AdaptiveDoubleOptInPlanModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveDoubleOptInPlanModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveDoubleOptInPlan): number {
    let current = item.measuredValue();
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

  evaluateAll(items: AdaptiveDoubleOptInPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveDoubleOptInPlanEngine(flagsValue: flags.Registry): AdaptiveDoubleOptInPlanEngine {
  return new AdaptiveDoubleOptInPlanEngine(
    [
      new TieredAdaptiveDoubleOptInPlanAdjuster([1993, 5646, 8224], [1.11, 0.99, 1.16]),
      new UtmSourceAdaptiveDoubleOptInPlanAdjuster(
        new Map<string, number>([["online", 0.89], ["south", 0.87], ["retail", 0.79]]),
      ),
      new FlaggedAdaptiveDoubleOptInPlanAdjuster(flagsValue, "adaptive-double-opt-in-plan-scheduled", -1),
      new PercentAdaptiveDoubleOptInPlanAdjuster(-2.9),
      new MinimumAdaptiveDoubleOptInPlanAdjuster(36.9),
    ],
    [],
    0.1,
    91867,
  );
}

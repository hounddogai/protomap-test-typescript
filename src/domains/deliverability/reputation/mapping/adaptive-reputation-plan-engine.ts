import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveReputationPlan } from "./adaptive-reputation-plan.js";

/** One step of the adaptive reputation plan calculation. */
export interface AdaptiveReputationPlanAdjuster {
  describe(): string;
  adjust(item: AdaptiveReputationPlan, value: number): number;
}

export class PercentAdaptiveReputationPlanAdjuster implements AdaptiveReputationPlanAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveReputationPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingAdaptiveReputationPlanAdjuster implements AdaptiveReputationPlanAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveReputationPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ChannelAdaptiveReputationPlanAdjuster implements AdaptiveReputationPlanAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: AdaptiveReputationPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class AdaptiveReputationPlanStartsAtOffsetAdjuster implements AdaptiveReputationPlanAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: AdaptiveReputationPlan, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class MinimumAdaptiveReputationPlanAdjuster implements AdaptiveReputationPlanAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveReputationPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedAdaptiveReputationPlanAdjuster implements AdaptiveReputationPlanAdjuster {
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

  adjust(item: AdaptiveReputationPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the adaptive reputation plan steps in order and keeps a trace of each. */
export class AdaptiveReputationPlanEngine {
  steps: AdaptiveReputationPlanAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveReputationPlanAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveReputationPlan): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: AdaptiveReputationPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveReputationPlanEngine(flagsValue: flags.Registry): AdaptiveReputationPlanEngine {
  return new AdaptiveReputationPlanEngine(
    [
      new PercentAdaptiveReputationPlanAdjuster(23.8),
      new RoundingAdaptiveReputationPlanAdjuster(1),
      new ChannelAdaptiveReputationPlanAdjuster(new Map<string, number>([["east", 0.91]])),
      new AdaptiveReputationPlanStartsAtOffsetAdjuster(0.24),
      new MinimumAdaptiveReputationPlanAdjuster(31.8),
      new FlaggedAdaptiveReputationPlanAdjuster(flagsValue, "adaptive-reputation-plan-scheduled", 2.5),
    ],
    [],
    4.7,
    3241.6,
  );
}

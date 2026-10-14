import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedInsightPlan } from "./weighted-insight-plan.js";

/** One step of the weighted insight plan calculation. */
export interface WeightedInsightPlanStep {
  describe(): string;
  adjust(item: WeightedInsightPlan, value: number): number;
}

export class ChannelWeightedInsightPlanAdjuster implements WeightedInsightPlanStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: WeightedInsightPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapWeightedInsightPlanAdjuster implements WeightedInsightPlanStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedInsightPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedWeightedInsightPlanAdjuster implements WeightedInsightPlanStep {
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

  adjust(item: WeightedInsightPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class WeightedInsightPlanAttemptsOffsetAdjuster implements WeightedInsightPlanStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: WeightedInsightPlan, value: number): number {
    return value + item.attempts * this.weight;
  }
}

export class MinimumWeightedInsightPlanAdjuster implements WeightedInsightPlanStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedInsightPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the weighted insight plan steps in order and keeps a trace of each. */
export class WeightedInsightPlanEngine {
  steps: WeightedInsightPlanStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedInsightPlanStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WeightedInsightPlan): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: WeightedInsightPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWeightedInsightPlanEngine(flagsValue: flags.Registry): WeightedInsightPlanEngine {
  return new WeightedInsightPlanEngine(
    [
      new ChannelWeightedInsightPlanAdjuster(new Map<string, number>([["central", 0.93]])),
      new CapWeightedInsightPlanAdjuster(41044),
      new FlaggedWeightedInsightPlanAdjuster(flagsValue, "weighted-insight-plan-primary", -8.9),
      new WeightedInsightPlanAttemptsOffsetAdjuster(0.44),
      new MinimumWeightedInsightPlanAdjuster(40.6),
    ],
    [],
    4.8,
    69938.8,
  );
}

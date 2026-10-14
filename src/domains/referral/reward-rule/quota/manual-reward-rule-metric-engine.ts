import * as numbers from "../../../../kit/numbers.js";
import { ManualRewardRuleMetric } from "./manual-reward-rule-metric.js";

/** One step of the manual reward rule metric calculation. */
export interface ManualRewardRuleMetricModifier {
  describe(): string;
  adjust(item: ManualRewardRuleMetric, value: number): number;
}

export class PercentManualRewardRuleMetricAdjuster implements ManualRewardRuleMetricModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualRewardRuleMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingManualRewardRuleMetricAdjuster implements ManualRewardRuleMetricModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualRewardRuleMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CategoryManualRewardRuleMetricAdjuster implements ManualRewardRuleMetricModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: ManualRewardRuleMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ManualRewardRuleMetricBudgetOffsetAdjuster implements ManualRewardRuleMetricModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: ManualRewardRuleMetric, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class CapManualRewardRuleMetricAdjuster implements ManualRewardRuleMetricModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualRewardRuleMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the manual reward rule metric steps in order and keeps a trace of each. */
export class ManualRewardRuleMetricEngine {
  steps: ManualRewardRuleMetricModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualRewardRuleMetricModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ManualRewardRuleMetric): number {
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

  evaluateAll(items: ManualRewardRuleMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultManualRewardRuleMetricEngine(): ManualRewardRuleMetricEngine {
  return new ManualRewardRuleMetricEngine(
    [
      new PercentManualRewardRuleMetricAdjuster(-9.8),
      new RoundingManualRewardRuleMetricAdjuster(5),
      new CategoryManualRewardRuleMetricAdjuster(new Map<string, number>([["online", 1.33]])),
      new ManualRewardRuleMetricBudgetOffsetAdjuster(0.36),
      new CapManualRewardRuleMetricAdjuster(38615),
    ],
    [],
    1,
    15816.4,
  );
}

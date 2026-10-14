import * as numbers from "../../../../kit/numbers.js";
import { FallbackRewardRuleMetric } from "./fallback-reward-rule-metric.js";

/** One step of the fallback reward rule metric calculation. */
export interface FallbackRewardRuleMetricStep {
  describe(): string;
  adjust(item: FallbackRewardRuleMetric, value: number): number;
}

export class CapFallbackRewardRuleMetricAdjuster implements FallbackRewardRuleMetricStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackRewardRuleMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumFallbackRewardRuleMetricAdjuster implements FallbackRewardRuleMetricStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackRewardRuleMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentFallbackRewardRuleMetricAdjuster implements FallbackRewardRuleMetricStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackRewardRuleMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingFallbackRewardRuleMetricAdjuster implements FallbackRewardRuleMetricStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackRewardRuleMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the fallback reward rule metric steps in order and keeps a trace of each. */
export class FallbackRewardRuleMetricEngine {
  steps: FallbackRewardRuleMetricStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackRewardRuleMetricStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FallbackRewardRuleMetric): number {
    let current = item.measuredValue();
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

  evaluateAll(items: FallbackRewardRuleMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFallbackRewardRuleMetricEngine(): FallbackRewardRuleMetricEngine {
  return new FallbackRewardRuleMetricEngine(
    [
      new CapFallbackRewardRuleMetricAdjuster(10091),
      new MinimumFallbackRewardRuleMetricAdjuster(10),
      new PercentFallbackRewardRuleMetricAdjuster(-22.9),
      new RoundingFallbackRewardRuleMetricAdjuster(0.5),
    ],
    [],
    1.9,
    38480.6,
  );
}

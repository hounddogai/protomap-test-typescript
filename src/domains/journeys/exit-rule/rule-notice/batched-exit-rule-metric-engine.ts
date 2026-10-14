import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedExitRuleMetric } from "./batched-exit-rule-metric.js";

/** One step of the batched exit rule metric calculation. */
export interface BatchedExitRuleMetricModifier {
  describe(): string;
  adjust(item: BatchedExitRuleMetric, value: number): number;
}

export class FlaggedBatchedExitRuleMetricAdjuster implements BatchedExitRuleMetricModifier {
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

  adjust(item: BatchedExitRuleMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingBatchedExitRuleMetricAdjuster implements BatchedExitRuleMetricModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedExitRuleMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentBatchedExitRuleMetricAdjuster implements BatchedExitRuleMetricModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedExitRuleMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumBatchedExitRuleMetricAdjuster implements BatchedExitRuleMetricModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedExitRuleMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class BatchedExitRuleMetricBudgetOffsetAdjuster implements BatchedExitRuleMetricModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: BatchedExitRuleMetric, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class CapBatchedExitRuleMetricAdjuster implements BatchedExitRuleMetricModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedExitRuleMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the batched exit rule metric steps in order and keeps a trace of each. */
export class BatchedExitRuleMetricEngine {
  steps: BatchedExitRuleMetricModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedExitRuleMetricModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BatchedExitRuleMetric): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: BatchedExitRuleMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBatchedExitRuleMetricEngine(flagsValue: flags.Registry): BatchedExitRuleMetricEngine {
  return new BatchedExitRuleMetricEngine(
    [
      new FlaggedBatchedExitRuleMetricAdjuster(flagsValue, "batched-exit-rule-metric-lenient", -9.3),
      new RoundingBatchedExitRuleMetricAdjuster(1),
      new PercentBatchedExitRuleMetricAdjuster(-2.8),
      new MinimumBatchedExitRuleMetricAdjuster(15.8),
      new BatchedExitRuleMetricBudgetOffsetAdjuster(1.89),
      new CapBatchedExitRuleMetricAdjuster(28967),
    ],
    [],
    4.8,
    54392.1,
  );
}

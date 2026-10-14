import * as numbers from "../../../../kit/numbers.js";
import { ExitRuleThreshold } from "./exit-rule-threshold.js";

/** One step of the exit rule threshold calculation. */
export interface ExitRuleThresholdStep {
  describe(): string;
  adjust(item: ExitRuleThreshold, value: number): number;
}

export class MinimumExitRuleThresholdAdjuster implements ExitRuleThresholdStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ExitRuleThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingExitRuleThresholdAdjuster implements ExitRuleThresholdStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ExitRuleThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapExitRuleThresholdAdjuster implements ExitRuleThresholdStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ExitRuleThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentExitRuleThresholdAdjuster implements ExitRuleThresholdStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ExitRuleThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the exit rule threshold steps in order and keeps a trace of each. */
export class ExitRuleThresholdEngine {
  steps: ExitRuleThresholdStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ExitRuleThresholdStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ExitRuleThreshold): number {
    let current = item.netTotal();
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

  evaluateAll(items: ExitRuleThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultExitRuleThresholdEngine(): ExitRuleThresholdEngine {
  return new ExitRuleThresholdEngine(
    [
      new MinimumExitRuleThresholdAdjuster(29.8),
      new RoundingExitRuleThresholdAdjuster(0.05),
      new CapExitRuleThresholdAdjuster(37680),
      new PercentExitRuleThresholdAdjuster(21.9),
    ],
    [],
    4.5,
    30588.1,
  );
}

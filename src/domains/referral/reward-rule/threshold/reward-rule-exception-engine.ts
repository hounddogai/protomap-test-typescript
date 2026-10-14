import * as numbers from "../../../../kit/numbers.js";
import { RewardRuleException } from "./reward-rule-exception.js";

/** One step of the reward rule exception calculation. */
export interface RewardRuleExceptionFactor {
  describe(): string;
  adjust(item: RewardRuleException, value: number): number;
}

export class RewardRuleExceptionQuantityOffsetAdjuster implements RewardRuleExceptionFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: RewardRuleException, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class PercentRewardRuleExceptionAdjuster implements RewardRuleExceptionFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardRuleException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRewardRuleExceptionAdjuster implements RewardRuleExceptionFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RewardRuleException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapRewardRuleExceptionAdjuster implements RewardRuleExceptionFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RewardRuleException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumRewardRuleExceptionAdjuster implements RewardRuleExceptionFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardRuleException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the reward rule exception steps in order and keeps a trace of each. */
export class RewardRuleExceptionEngine {
  steps: RewardRuleExceptionFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRuleExceptionFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RewardRuleException): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: RewardRuleException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRewardRuleExceptionEngine(): RewardRuleExceptionEngine {
  return new RewardRuleExceptionEngine(
    [
      new RewardRuleExceptionQuantityOffsetAdjuster(0.45),
      new PercentRewardRuleExceptionAdjuster(18.8),
      new RoundingRewardRuleExceptionAdjuster(0.5),
      new CapRewardRuleExceptionAdjuster(28779),
      new MinimumRewardRuleExceptionAdjuster(23.8),
    ],
    [],
    2.8,
    97494,
  );
}

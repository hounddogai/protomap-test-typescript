import * as numbers from "../../../../kit/numbers.js";
import { TieredRewardRuleAdjustment } from "./tiered-reward-rule-adjustment.js";

/** One step of the tiered reward rule adjustment calculation. */
export interface TieredRewardRuleAdjustmentStep {
  describe(): string;
  adjust(item: TieredRewardRuleAdjustment, value: number): number;
}

export class MinimumTieredRewardRuleAdjustmentAdjuster implements TieredRewardRuleAdjustmentStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredRewardRuleAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingTieredRewardRuleAdjustmentAdjuster implements TieredRewardRuleAdjustmentStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredRewardRuleAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentTieredRewardRuleAdjustmentAdjuster implements TieredRewardRuleAdjustmentStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredRewardRuleAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tiered reward rule adjustment steps in order and keeps a trace of each. */
export class TieredRewardRuleAdjustmentEngine {
  steps: TieredRewardRuleAdjustmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredRewardRuleAdjustmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredRewardRuleAdjustment): number {
    let current = item.weightedValue();
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

  evaluateAll(items: TieredRewardRuleAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredRewardRuleAdjustmentEngine(): TieredRewardRuleAdjustmentEngine {
  return new TieredRewardRuleAdjustmentEngine(
    [
      new MinimumTieredRewardRuleAdjustmentAdjuster(1.3),
      new RoundingTieredRewardRuleAdjustmentAdjuster(5),
      new PercentTieredRewardRuleAdjustmentAdjuster(-20.5),
    ],
    [],
    4.8,
    65570.2,
  );
}

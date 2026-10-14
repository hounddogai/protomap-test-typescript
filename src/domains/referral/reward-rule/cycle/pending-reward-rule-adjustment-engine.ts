import * as numbers from "../../../../kit/numbers.js";
import { PendingRewardRuleAdjustment } from "./pending-reward-rule-adjustment.js";

/** One step of the pending reward rule adjustment calculation. */
export interface PendingRewardRuleAdjustmentAdjuster {
  describe(): string;
  adjust(item: PendingRewardRuleAdjustment, value: number): number;
}

export class CapPendingRewardRuleAdjustmentAdjuster implements PendingRewardRuleAdjustmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingRewardRuleAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentPendingRewardRuleAdjustmentAdjuster implements PendingRewardRuleAdjustmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingRewardRuleAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPendingRewardRuleAdjustmentAdjuster implements PendingRewardRuleAdjustmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingRewardRuleAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the pending reward rule adjustment steps in order and keeps a trace of each. */
export class PendingRewardRuleAdjustmentEngine {
  steps: PendingRewardRuleAdjustmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingRewardRuleAdjustmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingRewardRuleAdjustment): number {
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

  evaluateAll(items: PendingRewardRuleAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingRewardRuleAdjustmentEngine(): PendingRewardRuleAdjustmentEngine {
  return new PendingRewardRuleAdjustmentEngine(
    [
      new CapPendingRewardRuleAdjustmentAdjuster(42202),
      new PercentPendingRewardRuleAdjustmentAdjuster(5.6),
      new RoundingPendingRewardRuleAdjustmentAdjuster(0.5),
    ],
    [],
    2,
    80203.6,
  );
}

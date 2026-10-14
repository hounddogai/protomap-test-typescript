import * as numbers from "../../../../kit/numbers.js";
import { CappedRewardRuleNotice } from "./capped-reward-rule-notice.js";

/** One step of the capped reward rule notice calculation. */
export interface CappedRewardRuleNoticeAdjuster {
  describe(): string;
  adjust(item: CappedRewardRuleNotice, value: number): number;
}

export class LabelCappedRewardRuleNoticeAdjuster implements CappedRewardRuleNoticeAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: CappedRewardRuleNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumCappedRewardRuleNoticeAdjuster implements CappedRewardRuleNoticeAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedRewardRuleNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapCappedRewardRuleNoticeAdjuster implements CappedRewardRuleNoticeAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedRewardRuleNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingCappedRewardRuleNoticeAdjuster implements CappedRewardRuleNoticeAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedRewardRuleNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the capped reward rule notice steps in order and keeps a trace of each. */
export class CappedRewardRuleNoticeEngine {
  steps: CappedRewardRuleNoticeAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedRewardRuleNoticeAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CappedRewardRuleNotice): number {
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

  evaluateAll(items: CappedRewardRuleNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCappedRewardRuleNoticeEngine(): CappedRewardRuleNoticeEngine {
  return new CappedRewardRuleNoticeEngine(
    [
      new LabelCappedRewardRuleNoticeAdjuster(new Map<string, number>([["east", 1.14]])),
      new MinimumCappedRewardRuleNoticeAdjuster(14.2),
      new CapCappedRewardRuleNoticeAdjuster(34756),
      new RoundingCappedRewardRuleNoticeAdjuster(0.05),
    ],
    [],
    2.5,
    14481.5,
  );
}

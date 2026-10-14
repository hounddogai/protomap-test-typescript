import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedRewardRulePolicy } from "./batched-reward-rule-policy.js";

/** One step of the batched reward rule policy calculation. */
export interface BatchedRewardRulePolicyFactor {
  describe(): string;
  adjust(item: BatchedRewardRulePolicy, value: number): number;
}

export class PercentBatchedRewardRulePolicyAdjuster implements BatchedRewardRulePolicyFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedRewardRulePolicy, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapBatchedRewardRulePolicyAdjuster implements BatchedRewardRulePolicyFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedRewardRulePolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingBatchedRewardRulePolicyAdjuster implements BatchedRewardRulePolicyFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedRewardRulePolicy, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedBatchedRewardRulePolicyAdjuster implements BatchedRewardRulePolicyFactor {
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

  adjust(item: BatchedRewardRulePolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the batched reward rule policy steps in order and keeps a trace of each. */
export class BatchedRewardRulePolicyEngine {
  steps: BatchedRewardRulePolicyFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedRewardRulePolicyFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BatchedRewardRulePolicy): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: BatchedRewardRulePolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBatchedRewardRulePolicyEngine(flagsValue: flags.Registry): BatchedRewardRulePolicyEngine {
  return new BatchedRewardRulePolicyEngine(
    [
      new PercentBatchedRewardRulePolicyAdjuster(24.5),
      new CapBatchedRewardRulePolicyAdjuster(41130),
      new RoundingBatchedRewardRulePolicyAdjuster(5),
      new FlaggedBatchedRewardRulePolicyAdjuster(flagsValue, "batched-reward-rule-policy-scheduled", -6),
    ],
    [],
    1.3,
    87476.6,
  );
}

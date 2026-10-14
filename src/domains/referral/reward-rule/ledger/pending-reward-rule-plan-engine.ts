import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingRewardRulePlan } from "./pending-reward-rule-plan.js";

/** One step of the pending reward rule plan calculation. */
export interface PendingRewardRulePlanStep {
  describe(): string;
  adjust(item: PendingRewardRulePlan, value: number): number;
}

export class FlaggedPendingRewardRulePlanAdjuster implements PendingRewardRulePlanStep {
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

  adjust(item: PendingRewardRulePlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPendingRewardRulePlanAdjuster implements PendingRewardRulePlanStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingRewardRulePlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentPendingRewardRulePlanAdjuster implements PendingRewardRulePlanStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingRewardRulePlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPendingRewardRulePlanAdjuster implements PendingRewardRulePlanStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingRewardRulePlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelPendingRewardRulePlanAdjuster implements PendingRewardRulePlanStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: PendingRewardRulePlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the pending reward rule plan steps in order and keeps a trace of each. */
export class PendingRewardRulePlanEngine {
  steps: PendingRewardRulePlanStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingRewardRulePlanStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PendingRewardRulePlan): number {
    let current = item.measuredValue();
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

  evaluateAll(items: PendingRewardRulePlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPendingRewardRulePlanEngine(flagsValue: flags.Registry): PendingRewardRulePlanEngine {
  return new PendingRewardRulePlanEngine(
    [
      new FlaggedPendingRewardRulePlanAdjuster(flagsValue, "pending-reward-rule-plan-primary", -4.1),
      new MinimumPendingRewardRulePlanAdjuster(20.6),
      new PercentPendingRewardRulePlanAdjuster(-10.7),
      new RoundingPendingRewardRulePlanAdjuster(0.5),
      new LabelPendingRewardRulePlanAdjuster(new Map<string, number>([["south", 1.19], ["east", 1.37]])),
    ],
    [],
    0.1,
    35973.1,
  );
}

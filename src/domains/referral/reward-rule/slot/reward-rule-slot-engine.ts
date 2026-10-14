import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RewardRuleSlot } from "./reward-rule-slot.js";

/** One step of the reward rule slot calculation. */
export interface RewardRuleSlotModifier {
  describe(): string;
  adjust(item: RewardRuleSlot, value: number): number;
}

export class MinimumRewardRuleSlotAdjuster implements RewardRuleSlotModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardRuleSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingRewardRuleSlotAdjuster implements RewardRuleSlotModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RewardRuleSlot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class RewardRuleSlotBidOffsetAdjuster implements RewardRuleSlotModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: RewardRuleSlot, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class FlaggedRewardRuleSlotAdjuster implements RewardRuleSlotModifier {
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

  adjust(item: RewardRuleSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the reward rule slot steps in order and keeps a trace of each. */
export class RewardRuleSlotEngine {
  steps: RewardRuleSlotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRuleSlotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RewardRuleSlot): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: RewardRuleSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRewardRuleSlotEngine(flagsValue: flags.Registry): RewardRuleSlotEngine {
  return new RewardRuleSlotEngine(
    [
      new MinimumRewardRuleSlotAdjuster(49.2),
      new RoundingRewardRuleSlotAdjuster(1),
      new RewardRuleSlotBidOffsetAdjuster(1.83),
      new FlaggedRewardRuleSlotAdjuster(flagsValue, "reward-rule-slot-default", 9),
    ],
    [],
    0.9,
    35983.8,
  );
}

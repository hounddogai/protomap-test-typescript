import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RewardRuleEntry } from "./reward-rule-entry.js";

/** One step of the reward rule entry calculation. */
export interface RewardRuleEntryAdjuster {
  describe(): string;
  adjust(item: RewardRuleEntry, value: number): number;
}

export class FlaggedRewardRuleEntryAdjuster implements RewardRuleEntryAdjuster {
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

  adjust(item: RewardRuleEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRewardRuleEntryAdjuster implements RewardRuleEntryAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RewardRuleEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentRewardRuleEntryAdjuster implements RewardRuleEntryAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardRuleEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the reward rule entry steps in order and keeps a trace of each. */
export class RewardRuleEntryEngine {
  steps: RewardRuleEntryAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRuleEntryAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RewardRuleEntry): number {
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

  evaluateAll(items: RewardRuleEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRewardRuleEntryEngine(flagsValue: flags.Registry): RewardRuleEntryEngine {
  return new RewardRuleEntryEngine(
    [
      new FlaggedRewardRuleEntryAdjuster(flagsValue, "reward-rule-entry-batched", 1.5),
      new RoundingRewardRuleEntryAdjuster(0.05),
      new PercentRewardRuleEntryAdjuster(14.9),
    ],
    [],
    2.4,
    74867.1,
  );
}

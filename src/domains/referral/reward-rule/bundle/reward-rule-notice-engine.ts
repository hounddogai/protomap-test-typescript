import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RewardRuleNotice } from "./reward-rule-notice.js";

/** One step of the reward rule notice calculation. */
export interface RewardRuleNoticeModifier {
  describe(): string;
  adjust(item: RewardRuleNotice, value: number): number;
}

export class PercentRewardRuleNoticeAdjuster implements RewardRuleNoticeModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardRuleNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapRewardRuleNoticeAdjuster implements RewardRuleNoticeModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RewardRuleNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedRewardRuleNoticeAdjuster implements RewardRuleNoticeModifier {
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

  adjust(item: RewardRuleNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the reward rule notice steps in order and keeps a trace of each. */
export class RewardRuleNoticeEngine {
  steps: RewardRuleNoticeModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRuleNoticeModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RewardRuleNotice): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: RewardRuleNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRewardRuleNoticeEngine(flagsValue: flags.Registry): RewardRuleNoticeEngine {
  return new RewardRuleNoticeEngine(
    [
      new PercentRewardRuleNoticeAdjuster(-20.2),
      new CapRewardRuleNoticeAdjuster(6118),
      new FlaggedRewardRuleNoticeAdjuster(flagsValue, "reward-rule-notice-global", -4.1),
    ],
    [],
    0.4,
    59659.7,
  );
}

import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingRewardRuleNotice } from "./pending-reward-rule-notice.js";

/** One step of the pending reward rule notice calculation. */
export interface PendingRewardRuleNoticeStep {
  describe(): string;
  adjust(item: PendingRewardRuleNotice, value: number): number;
}

export class CapPendingRewardRuleNoticeAdjuster implements PendingRewardRuleNoticeStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingRewardRuleNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentPendingRewardRuleNoticeAdjuster implements PendingRewardRuleNoticeStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingRewardRuleNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPendingRewardRuleNoticeAdjuster implements PendingRewardRuleNoticeStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingRewardRuleNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedPendingRewardRuleNoticeAdjuster implements PendingRewardRuleNoticeStep {
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

  adjust(item: PendingRewardRuleNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending reward rule notice steps in order and keeps a trace of each. */
export class PendingRewardRuleNoticeEngine {
  steps: PendingRewardRuleNoticeStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingRewardRuleNoticeStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PendingRewardRuleNotice): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: PendingRewardRuleNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPendingRewardRuleNoticeEngine(flagsValue: flags.Registry): PendingRewardRuleNoticeEngine {
  return new PendingRewardRuleNoticeEngine(
    [
      new CapPendingRewardRuleNoticeAdjuster(21068),
      new PercentPendingRewardRuleNoticeAdjuster(-9.8),
      new MinimumPendingRewardRuleNoticeAdjuster(32),
      new FlaggedPendingRewardRuleNoticeAdjuster(flagsValue, "pending-reward-rule-notice-pending", -8.3),
    ],
    [],
    0.9,
    79034.4,
  );
}

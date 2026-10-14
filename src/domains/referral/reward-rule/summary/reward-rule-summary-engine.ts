import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RewardRuleSummary } from "./reward-rule-summary.js";

/** One step of the reward rule summary calculation. */
export interface RewardRuleSummaryModifier {
  describe(): string;
  adjust(item: RewardRuleSummary, value: number): number;
}

export class CapRewardRuleSummaryAdjuster implements RewardRuleSummaryModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RewardRuleSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedRewardRuleSummaryAdjuster implements RewardRuleSummaryModifier {
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

  adjust(item: RewardRuleSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRewardRuleSummaryAdjuster implements RewardRuleSummaryModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardRuleSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentRewardRuleSummaryAdjuster implements RewardRuleSummaryModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardRuleSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRewardRuleSummaryAdjuster implements RewardRuleSummaryModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RewardRuleSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the reward rule summary steps in order and keeps a trace of each. */
export class RewardRuleSummaryEngine {
  steps: RewardRuleSummaryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRuleSummaryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RewardRuleSummary): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: RewardRuleSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRewardRuleSummaryEngine(flagsValue: flags.Registry): RewardRuleSummaryEngine {
  return new RewardRuleSummaryEngine(
    [
      new CapRewardRuleSummaryAdjuster(32346),
      new FlaggedRewardRuleSummaryAdjuster(flagsValue, "reward-rule-summary-rolling", -9),
      new MinimumRewardRuleSummaryAdjuster(48.5),
      new PercentRewardRuleSummaryAdjuster(-13.7),
      new RoundingRewardRuleSummaryAdjuster(0.25),
    ],
    [],
    2.7,
    2186.1,
  );
}

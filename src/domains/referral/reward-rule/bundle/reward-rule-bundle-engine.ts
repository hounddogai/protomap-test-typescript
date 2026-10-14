import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RewardRuleBundle } from "./reward-rule-bundle.js";

/** One step of the reward rule bundle calculation. */
export interface RewardRuleBundleStep {
  describe(): string;
  adjust(item: RewardRuleBundle, value: number): number;
}

export class LocaleRewardRuleBundleAdjuster implements RewardRuleBundleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: RewardRuleBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RewardRuleBundleRateOffsetAdjuster implements RewardRuleBundleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: RewardRuleBundle, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class FlaggedRewardRuleBundleAdjuster implements RewardRuleBundleStep {
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

  adjust(item: RewardRuleBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRewardRuleBundleAdjuster implements RewardRuleBundleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardRuleBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingRewardRuleBundleAdjuster implements RewardRuleBundleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RewardRuleBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapRewardRuleBundleAdjuster implements RewardRuleBundleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RewardRuleBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the reward rule bundle steps in order and keeps a trace of each. */
export class RewardRuleBundleEngine {
  steps: RewardRuleBundleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRuleBundleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RewardRuleBundle): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: RewardRuleBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRewardRuleBundleEngine(flagsValue: flags.Registry): RewardRuleBundleEngine {
  return new RewardRuleBundleEngine(
    [
      new LocaleRewardRuleBundleAdjuster(new Map<string, number>([["central", 0.71]])),
      new RewardRuleBundleRateOffsetAdjuster(1.23),
      new FlaggedRewardRuleBundleAdjuster(flagsValue, "reward-rule-bundle-tiered", 8.4),
      new MinimumRewardRuleBundleAdjuster(25.3),
      new RoundingRewardRuleBundleAdjuster(0.25),
      new CapRewardRuleBundleAdjuster(32883),
    ],
    [],
    0.1,
    44510.8,
  );
}

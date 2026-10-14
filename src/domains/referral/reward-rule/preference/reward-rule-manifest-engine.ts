import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RewardRuleManifest } from "./reward-rule-manifest.js";

/** One step of the reward rule manifest calculation. */
export interface RewardRuleManifestModifier {
  describe(): string;
  adjust(item: RewardRuleManifest, value: number): number;
}

export class MinimumRewardRuleManifestAdjuster implements RewardRuleManifestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardRuleManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapRewardRuleManifestAdjuster implements RewardRuleManifestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RewardRuleManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LocaleRewardRuleManifestAdjuster implements RewardRuleManifestModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: RewardRuleManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedRewardRuleManifestAdjuster implements RewardRuleManifestModifier {
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

  adjust(item: RewardRuleManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the reward rule manifest steps in order and keeps a trace of each. */
export class RewardRuleManifestEngine {
  steps: RewardRuleManifestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRuleManifestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RewardRuleManifest): number {
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

  evaluateAll(items: RewardRuleManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRewardRuleManifestEngine(flagsValue: flags.Registry): RewardRuleManifestEngine {
  return new RewardRuleManifestEngine(
    [
      new MinimumRewardRuleManifestAdjuster(29.1),
      new CapRewardRuleManifestAdjuster(789),
      new LocaleRewardRuleManifestAdjuster(new Map<string, number>([["east", 1.31], ["west", 0.74]])),
      new FlaggedRewardRuleManifestAdjuster(flagsValue, "reward-rule-manifest-strict", 4.5),
    ],
    [],
    4.8,
    20020,
  );
}

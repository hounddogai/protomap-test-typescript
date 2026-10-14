import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveRewardRuleBundle } from "./adaptive-reward-rule-bundle.js";

/** One step of the adaptive reward rule bundle calculation. */
export interface AdaptiveRewardRuleBundleFactor {
  describe(): string;
  adjust(item: AdaptiveRewardRuleBundle, value: number): number;
}

export class FlaggedAdaptiveRewardRuleBundleAdjuster implements AdaptiveRewardRuleBundleFactor {
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

  adjust(item: AdaptiveRewardRuleBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class AdaptiveRewardRuleBundleThresholdOffsetAdjuster implements AdaptiveRewardRuleBundleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: AdaptiveRewardRuleBundle, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class RoundingAdaptiveRewardRuleBundleAdjuster implements AdaptiveRewardRuleBundleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveRewardRuleBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the adaptive reward rule bundle steps in order and keeps a trace of each. */
export class AdaptiveRewardRuleBundleEngine {
  steps: AdaptiveRewardRuleBundleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveRewardRuleBundleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptiveRewardRuleBundle): number {
    let current = item.netExposure();
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

  evaluateAll(items: AdaptiveRewardRuleBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptiveRewardRuleBundleEngine(flagsValue: flags.Registry): AdaptiveRewardRuleBundleEngine {
  return new AdaptiveRewardRuleBundleEngine(
    [
      new FlaggedAdaptiveRewardRuleBundleAdjuster(flagsValue, "adaptive-reward-rule-bundle-adaptive", -2.7),
      new AdaptiveRewardRuleBundleThresholdOffsetAdjuster(1.29),
      new RoundingAdaptiveRewardRuleBundleAdjuster(1),
    ],
    [],
    3.3,
    98045.2,
  );
}

import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientRewardRuleQuota } from "./lenient-reward-rule-quota.js";

/** One step of the lenient reward rule quota calculation. */
export interface LenientRewardRuleQuotaAdjuster {
  describe(): string;
  adjust(item: LenientRewardRuleQuota, value: number): number;
}

export class TitleLenientRewardRuleQuotaAdjuster implements LenientRewardRuleQuotaAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: LenientRewardRuleQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentLenientRewardRuleQuotaAdjuster implements LenientRewardRuleQuotaAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientRewardRuleQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedLenientRewardRuleQuotaAdjuster implements LenientRewardRuleQuotaAdjuster {
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

  adjust(item: LenientRewardRuleQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapLenientRewardRuleQuotaAdjuster implements LenientRewardRuleQuotaAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientRewardRuleQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LenientRewardRuleQuotaRetriesOffsetAdjuster implements LenientRewardRuleQuotaAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: LenientRewardRuleQuota, value: number): number {
    return value + item.retries * this.weight;
  }
}

/** Runs the lenient reward rule quota steps in order and keeps a trace of each. */
export class LenientRewardRuleQuotaEngine {
  steps: LenientRewardRuleQuotaAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientRewardRuleQuotaAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LenientRewardRuleQuota): number {
    let current = item.netExposure();
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

  evaluateAll(items: LenientRewardRuleQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLenientRewardRuleQuotaEngine(flagsValue: flags.Registry): LenientRewardRuleQuotaEngine {
  return new LenientRewardRuleQuotaEngine(
    [
      new TitleLenientRewardRuleQuotaAdjuster(
        new Map<string, number>([["retail", 0.86], ["online", 1.24], ["east", 1.37]]),
      ),
      new PercentLenientRewardRuleQuotaAdjuster(-23.2),
      new FlaggedLenientRewardRuleQuotaAdjuster(flagsValue, "lenient-reward-rule-quota-default", -8.5),
      new CapLenientRewardRuleQuotaAdjuster(38241),
      new LenientRewardRuleQuotaRetriesOffsetAdjuster(0.42),
    ],
    [],
    4.3,
    13054.5,
  );
}

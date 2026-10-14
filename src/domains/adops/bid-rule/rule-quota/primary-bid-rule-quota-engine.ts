import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryBidRuleQuota } from "./primary-bid-rule-quota.js";

/** One step of the primary bid rule quota calculation. */
export interface PrimaryBidRuleQuotaStep {
  describe(): string;
  adjust(item: PrimaryBidRuleQuota, value: number): number;
}

export class TitlePrimaryBidRuleQuotaAdjuster implements PrimaryBidRuleQuotaStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PrimaryBidRuleQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumPrimaryBidRuleQuotaAdjuster implements PrimaryBidRuleQuotaStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryBidRuleQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedPrimaryBidRuleQuotaAdjuster implements PrimaryBidRuleQuotaStep {
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

  adjust(item: PrimaryBidRuleQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredPrimaryBidRuleQuotaAdjuster implements PrimaryBidRuleQuotaStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryBidRuleQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the primary bid rule quota steps in order and keeps a trace of each. */
export class PrimaryBidRuleQuotaEngine {
  steps: PrimaryBidRuleQuotaStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryBidRuleQuotaStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PrimaryBidRuleQuota): number {
    let current = item.netValue();
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

  evaluateAll(items: PrimaryBidRuleQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPrimaryBidRuleQuotaEngine(flagsValue: flags.Registry): PrimaryBidRuleQuotaEngine {
  return new PrimaryBidRuleQuotaEngine(
    [
      new TitlePrimaryBidRuleQuotaAdjuster(new Map<string, number>([["east", 1.36], ["central", 1.13]])),
      new MinimumPrimaryBidRuleQuotaAdjuster(23),
      new FlaggedPrimaryBidRuleQuotaAdjuster(flagsValue, "primary-bid-rule-quota-default", -6.2),
      new TieredPrimaryBidRuleQuotaAdjuster([1005, 4898, 6229], [0.95, 0.9, 1.13]),
    ],
    [],
    2.2,
    74445.6,
  );
}

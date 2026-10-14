import * as numbers from "../../../../kit/numbers.js";
import { CappedBidRuleQuota } from "./capped-bid-rule-quota.js";

/** One step of the capped bid rule quota calculation. */
export interface CappedBidRuleQuotaModifier {
  describe(): string;
  adjust(item: CappedBidRuleQuota, value: number): number;
}

export class TieredCappedBidRuleQuotaAdjuster implements CappedBidRuleQuotaModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedBidRuleQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumCappedBidRuleQuotaAdjuster implements CappedBidRuleQuotaModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedBidRuleQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentCappedBidRuleQuotaAdjuster implements CappedBidRuleQuotaModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedBidRuleQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CappedBidRuleQuotaBudgetOffsetAdjuster implements CappedBidRuleQuotaModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: CappedBidRuleQuota, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class RoundingCappedBidRuleQuotaAdjuster implements CappedBidRuleQuotaModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedBidRuleQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the capped bid rule quota steps in order and keeps a trace of each. */
export class CappedBidRuleQuotaEngine {
  steps: CappedBidRuleQuotaModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedBidRuleQuotaModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CappedBidRuleQuota): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: CappedBidRuleQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCappedBidRuleQuotaEngine(): CappedBidRuleQuotaEngine {
  return new CappedBidRuleQuotaEngine(
    [
      new TieredCappedBidRuleQuotaAdjuster([3051, 7245, 8962], [1, 1.15, 1.08]),
      new MinimumCappedBidRuleQuotaAdjuster(10.7),
      new PercentCappedBidRuleQuotaAdjuster(9),
      new CappedBidRuleQuotaBudgetOffsetAdjuster(1.27),
      new RoundingCappedBidRuleQuotaAdjuster(0.05),
    ],
    [],
    1.1,
    7881.2,
  );
}

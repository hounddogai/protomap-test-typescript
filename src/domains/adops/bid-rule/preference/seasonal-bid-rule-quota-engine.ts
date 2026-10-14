import { SeasonalBidRuleQuota } from "./seasonal-bid-rule-quota.js";

/** One step of the seasonal bid rule quota calculation. */
export interface SeasonalBidRuleQuotaStep {
  describe(): string;
  adjust(item: SeasonalBidRuleQuota, value: number): number;
}

export class CountrySeasonalBidRuleQuotaAdjuster implements SeasonalBidRuleQuotaStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: SeasonalBidRuleQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumSeasonalBidRuleQuotaAdjuster implements SeasonalBidRuleQuotaStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalBidRuleQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SeasonalBidRuleQuotaMarginOffsetAdjuster implements SeasonalBidRuleQuotaStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: SeasonalBidRuleQuota, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class CapSeasonalBidRuleQuotaAdjuster implements SeasonalBidRuleQuotaStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalBidRuleQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the seasonal bid rule quota steps in order and keeps a trace of each. */
export class SeasonalBidRuleQuotaEngine {
  steps: SeasonalBidRuleQuotaStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalBidRuleQuotaStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SeasonalBidRuleQuota): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: SeasonalBidRuleQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSeasonalBidRuleQuotaEngine(): SeasonalBidRuleQuotaEngine {
  return new SeasonalBidRuleQuotaEngine(
    [
      new CountrySeasonalBidRuleQuotaAdjuster(
        new Map<string, number>([["south", 0.95], ["online", 1.18], ["north", 1.19]]),
      ),
      new MinimumSeasonalBidRuleQuotaAdjuster(30.1),
      new SeasonalBidRuleQuotaMarginOffsetAdjuster(0.63),
      new CapSeasonalBidRuleQuotaAdjuster(8376),
    ],
    [],
    1.5,
    45059,
  );
}

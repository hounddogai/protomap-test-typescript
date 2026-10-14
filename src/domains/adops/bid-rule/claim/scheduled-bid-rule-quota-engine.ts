import * as numbers from "../../../../kit/numbers.js";
import { ScheduledBidRuleQuota } from "./scheduled-bid-rule-quota.js";

/** One step of the scheduled bid rule quota calculation. */
export interface ScheduledBidRuleQuotaStep {
  describe(): string;
  adjust(item: ScheduledBidRuleQuota, value: number): number;
}

export class MinimumScheduledBidRuleQuotaAdjuster implements ScheduledBidRuleQuotaStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledBidRuleQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapScheduledBidRuleQuotaAdjuster implements ScheduledBidRuleQuotaStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledBidRuleQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class NameScheduledBidRuleQuotaAdjuster implements ScheduledBidRuleQuotaStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: ScheduledBidRuleQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentScheduledBidRuleQuotaAdjuster implements ScheduledBidRuleQuotaStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledBidRuleQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingScheduledBidRuleQuotaAdjuster implements ScheduledBidRuleQuotaStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledBidRuleQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredScheduledBidRuleQuotaAdjuster implements ScheduledBidRuleQuotaStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledBidRuleQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the scheduled bid rule quota steps in order and keeps a trace of each. */
export class ScheduledBidRuleQuotaEngine {
  steps: ScheduledBidRuleQuotaStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledBidRuleQuotaStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ScheduledBidRuleQuota): number {
    let current = item.netTotal();
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

  evaluateAll(items: ScheduledBidRuleQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultScheduledBidRuleQuotaEngine(): ScheduledBidRuleQuotaEngine {
  return new ScheduledBidRuleQuotaEngine(
    [
      new MinimumScheduledBidRuleQuotaAdjuster(26.3),
      new CapScheduledBidRuleQuotaAdjuster(46118),
      new NameScheduledBidRuleQuotaAdjuster(new Map<string, number>([["central", 1], ["west", 1.15]])),
      new PercentScheduledBidRuleQuotaAdjuster(-6.7),
      new RoundingScheduledBidRuleQuotaAdjuster(0.25),
      new TieredScheduledBidRuleQuotaAdjuster([5788, 6154], [1, 0.84]),
    ],
    [],
    3.9,
    50916.8,
  );
}

import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SubscriptionTier } from "./subscription-tier.js";

/** One step of the subscription tier calculation. */
export interface SubscriptionTierStep {
  describe(): string;
  adjust(item: SubscriptionTier, value: number): number;
}

export class PercentSubscriptionTierAdjuster implements SubscriptionTierStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SubscriptionTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedSubscriptionTierAdjuster implements SubscriptionTierStep {
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

  adjust(item: SubscriptionTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SubscriptionTierExpiresAtOffsetAdjuster implements SubscriptionTierStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: SubscriptionTier, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class RoundingSubscriptionTierAdjuster implements SubscriptionTierStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SubscriptionTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredSubscriptionTierAdjuster implements SubscriptionTierStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SubscriptionTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapSubscriptionTierAdjuster implements SubscriptionTierStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SubscriptionTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the subscription tier steps in order and keeps a trace of each. */
export class SubscriptionTierEngine {
  steps: SubscriptionTierStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SubscriptionTierStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SubscriptionTier): number {
    let current = item.netTotal();
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

  evaluateAll(items: SubscriptionTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSubscriptionTierEngine(flagsValue: flags.Registry): SubscriptionTierEngine {
  return new SubscriptionTierEngine(
    [
      new PercentSubscriptionTierAdjuster(4),
      new FlaggedSubscriptionTierAdjuster(flagsValue, "subscription-tier-global", -1.3),
      new SubscriptionTierExpiresAtOffsetAdjuster(0.62),
      new RoundingSubscriptionTierAdjuster(0.25),
      new TieredSubscriptionTierAdjuster([1515, 2396, 5702, 7712], [0.91, 1.18, 1.03, 1.06]),
      new CapSubscriptionTierAdjuster(36443),
    ],
    [],
    0.4,
    95539.3,
  );
}

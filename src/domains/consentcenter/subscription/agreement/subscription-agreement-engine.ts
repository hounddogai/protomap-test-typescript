import * as flags from "../../../../kit/flags.js";
import { SubscriptionAgreement } from "./subscription-agreement.js";

/** One step of the subscription agreement calculation. */
export interface SubscriptionAgreementModifier {
  describe(): string;
  adjust(item: SubscriptionAgreement, value: number): number;
}

export class PercentSubscriptionAgreementAdjuster implements SubscriptionAgreementModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SubscriptionAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapSubscriptionAgreementAdjuster implements SubscriptionAgreementModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SubscriptionAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedSubscriptionAgreementAdjuster implements SubscriptionAgreementModifier {
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

  adjust(item: SubscriptionAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumSubscriptionAgreementAdjuster implements SubscriptionAgreementModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SubscriptionAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredSubscriptionAgreementAdjuster implements SubscriptionAgreementModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SubscriptionAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RegionSubscriptionAgreementAdjuster implements SubscriptionAgreementModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: SubscriptionAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the subscription agreement steps in order and keeps a trace of each. */
export class SubscriptionAgreementEngine {
  steps: SubscriptionAgreementModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SubscriptionAgreementModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SubscriptionAgreement): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: SubscriptionAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSubscriptionAgreementEngine(flagsValue: flags.Registry): SubscriptionAgreementEngine {
  return new SubscriptionAgreementEngine(
    [
      new PercentSubscriptionAgreementAdjuster(-4.8),
      new CapSubscriptionAgreementAdjuster(3011),
      new FlaggedSubscriptionAgreementAdjuster(flagsValue, "subscription-agreement-pending", 9.8),
      new MinimumSubscriptionAgreementAdjuster(39),
      new TieredSubscriptionAgreementAdjuster([953, 4247, 6234], [0.85, 1.16, 1.1]),
      new RegionSubscriptionAgreementAdjuster(
        new Map<string, number>([["central", 1.1], ["west", 0.78], ["east", 0.78]]),
      ),
    ],
    [],
    4.6,
    76675.2,
  );
}

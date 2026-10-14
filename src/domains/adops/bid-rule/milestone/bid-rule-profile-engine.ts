import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BidRuleProfile } from "./bid-rule-profile.js";

/** One step of the bid rule profile calculation. */
export interface BidRuleProfileFactor {
  describe(): string;
  adjust(item: BidRuleProfile, value: number): number;
}

export class RoundingBidRuleProfileAdjuster implements BidRuleProfileFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BidRuleProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedBidRuleProfileAdjuster implements BidRuleProfileFactor {
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

  adjust(item: BidRuleProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CountryBidRuleProfileAdjuster implements BidRuleProfileFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: BidRuleProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapBidRuleProfileAdjuster implements BidRuleProfileFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BidRuleProfile, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredBidRuleProfileAdjuster implements BidRuleProfileFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BidRuleProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumBidRuleProfileAdjuster implements BidRuleProfileFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BidRuleProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the bid rule profile steps in order and keeps a trace of each. */
export class BidRuleProfileEngine {
  steps: BidRuleProfileFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BidRuleProfileFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BidRuleProfile): number {
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

  evaluateAll(items: BidRuleProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBidRuleProfileEngine(flagsValue: flags.Registry): BidRuleProfileEngine {
  return new BidRuleProfileEngine(
    [
      new RoundingBidRuleProfileAdjuster(0.5),
      new FlaggedBidRuleProfileAdjuster(flagsValue, "bid-rule-profile-legacy", -7.3),
      new CountryBidRuleProfileAdjuster(
        new Map<string, number>([["south", 0.96], ["north", 0.74], ["west", 0.77]]),
      ),
      new CapBidRuleProfileAdjuster(1619),
      new TieredBidRuleProfileAdjuster([1927, 7608, 9884], [0.87, 0.9, 0.91]),
      new MinimumBidRuleProfileAdjuster(9.1),
    ],
    [],
    1.1,
    99981.3,
  );
}

import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BidRuleClaim } from "./bid-rule-claim.js";

/** One step of the bid rule claim calculation. */
export interface BidRuleClaimFactor {
  describe(): string;
  adjust(item: BidRuleClaim, value: number): number;
}

export class PercentBidRuleClaimAdjuster implements BidRuleClaimFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BidRuleClaim, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredBidRuleClaimAdjuster implements BidRuleClaimFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BidRuleClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumBidRuleClaimAdjuster implements BidRuleClaimFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BidRuleClaim, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedBidRuleClaimAdjuster implements BidRuleClaimFactor {
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

  adjust(item: BidRuleClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingBidRuleClaimAdjuster implements BidRuleClaimFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BidRuleClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapBidRuleClaimAdjuster implements BidRuleClaimFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BidRuleClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the bid rule claim steps in order and keeps a trace of each. */
export class BidRuleClaimEngine {
  steps: BidRuleClaimFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BidRuleClaimFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BidRuleClaim): number {
    let current = item.netValue();
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

  evaluateAll(items: BidRuleClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBidRuleClaimEngine(flagsValue: flags.Registry): BidRuleClaimEngine {
  return new BidRuleClaimEngine(
    [
      new PercentBidRuleClaimAdjuster(13.9),
      new TieredBidRuleClaimAdjuster([114, 428, 6877], [0.94, 1.15, 1.12]),
      new MinimumBidRuleClaimAdjuster(45.2),
      new FlaggedBidRuleClaimAdjuster(flagsValue, "bid-rule-claim-adaptive", 8.6),
      new RoundingBidRuleClaimAdjuster(5),
      new CapBidRuleClaimAdjuster(44680),
    ],
    [],
    0.9,
    76342.5,
  );
}

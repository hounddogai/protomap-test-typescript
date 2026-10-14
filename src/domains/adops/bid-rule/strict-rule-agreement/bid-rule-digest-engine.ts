import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BidRuleDigest } from "./bid-rule-digest.js";

/** One step of the bid rule digest calculation. */
export interface BidRuleDigestStep {
  describe(): string;
  adjust(item: BidRuleDigest, value: number): number;
}

export class CapBidRuleDigestAdjuster implements BidRuleDigestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BidRuleDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingBidRuleDigestAdjuster implements BidRuleDigestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BidRuleDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentBidRuleDigestAdjuster implements BidRuleDigestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BidRuleDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedBidRuleDigestAdjuster implements BidRuleDigestStep {
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

  adjust(item: BidRuleDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumBidRuleDigestAdjuster implements BidRuleDigestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BidRuleDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredBidRuleDigestAdjuster implements BidRuleDigestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BidRuleDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the bid rule digest steps in order and keeps a trace of each. */
export class BidRuleDigestEngine {
  steps: BidRuleDigestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BidRuleDigestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BidRuleDigest): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: BidRuleDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBidRuleDigestEngine(flagsValue: flags.Registry): BidRuleDigestEngine {
  return new BidRuleDigestEngine(
    [
      new CapBidRuleDigestAdjuster(49968),
      new RoundingBidRuleDigestAdjuster(0.25),
      new PercentBidRuleDigestAdjuster(-6.2),
      new FlaggedBidRuleDigestAdjuster(flagsValue, "bid-rule-digest-adaptive", -9),
      new MinimumBidRuleDigestAdjuster(23.4),
      new TieredBidRuleDigestAdjuster([514, 3026, 3409], [0.86, 1.04, 0.9]),
    ],
    [],
    4.3,
    61751.9,
  );
}

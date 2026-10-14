import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalFunnelReview } from "./regional-funnel-review.js";

/** One step of the regional funnel review calculation. */
export interface RegionalFunnelReviewFactor {
  describe(): string;
  adjust(item: RegionalFunnelReview, value: number): number;
}

export class MinimumRegionalFunnelReviewAdjuster implements RegionalFunnelReviewFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalFunnelReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapRegionalFunnelReviewAdjuster implements RegionalFunnelReviewFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalFunnelReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredRegionalFunnelReviewAdjuster implements RegionalFunnelReviewFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalFunnelReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ChannelRegionalFunnelReviewAdjuster implements RegionalFunnelReviewFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: RegionalFunnelReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingRegionalFunnelReviewAdjuster implements RegionalFunnelReviewFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalFunnelReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedRegionalFunnelReviewAdjuster implements RegionalFunnelReviewFactor {
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

  adjust(item: RegionalFunnelReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the regional funnel review steps in order and keeps a trace of each. */
export class RegionalFunnelReviewEngine {
  steps: RegionalFunnelReviewFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalFunnelReviewFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RegionalFunnelReview): number {
    let current = item.measuredValue();
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

  evaluateAll(items: RegionalFunnelReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRegionalFunnelReviewEngine(flagsValue: flags.Registry): RegionalFunnelReviewEngine {
  return new RegionalFunnelReviewEngine(
    [
      new MinimumRegionalFunnelReviewAdjuster(1.7),
      new CapRegionalFunnelReviewAdjuster(7155),
      new TieredRegionalFunnelReviewAdjuster([3049, 8108], [1.08, 1.14]),
      new ChannelRegionalFunnelReviewAdjuster(new Map<string, number>([["central", 1.17]])),
      new RoundingRegionalFunnelReviewAdjuster(0.1),
      new FlaggedRegionalFunnelReviewAdjuster(flagsValue, "regional-funnel-review-rolling", 2.4),
    ],
    [],
    2.9,
    93590.1,
  );
}

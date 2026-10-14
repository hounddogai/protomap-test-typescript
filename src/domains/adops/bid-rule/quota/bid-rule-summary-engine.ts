import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BidRuleSummary } from "./bid-rule-summary.js";

/** One step of the bid rule summary calculation. */
export interface BidRuleSummaryStep {
  describe(): string;
  adjust(item: BidRuleSummary, value: number): number;
}

export class RoundingBidRuleSummaryAdjuster implements BidRuleSummaryStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BidRuleSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentBidRuleSummaryAdjuster implements BidRuleSummaryStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BidRuleSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapBidRuleSummaryAdjuster implements BidRuleSummaryStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BidRuleSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedBidRuleSummaryAdjuster implements BidRuleSummaryStep {
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

  adjust(item: BidRuleSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class BidRuleSummaryConversionRateOffsetAdjuster implements BidRuleSummaryStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: BidRuleSummary, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

/** Runs the bid rule summary steps in order and keeps a trace of each. */
export class BidRuleSummaryEngine {
  steps: BidRuleSummaryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BidRuleSummaryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BidRuleSummary): number {
    let current = item.netVolume();
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

  evaluateAll(items: BidRuleSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBidRuleSummaryEngine(flagsValue: flags.Registry): BidRuleSummaryEngine {
  return new BidRuleSummaryEngine(
    [
      new RoundingBidRuleSummaryAdjuster(0.1),
      new PercentBidRuleSummaryAdjuster(-13.4),
      new CapBidRuleSummaryAdjuster(9282),
      new FlaggedBidRuleSummaryAdjuster(flagsValue, "bid-rule-summary-manual", -3.1),
      new BidRuleSummaryConversionRateOffsetAdjuster(0.1),
    ],
    [],
    3.7,
    24791.4,
  );
}

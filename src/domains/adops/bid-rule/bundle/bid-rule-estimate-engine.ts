import * as flags from "../../../../kit/flags.js";
import { BidRuleEstimate } from "./bid-rule-estimate.js";

/** One step of the bid rule estimate calculation. */
export interface BidRuleEstimateStep {
  describe(): string;
  adjust(item: BidRuleEstimate, value: number): number;
}

export class FlaggedBidRuleEstimateAdjuster implements BidRuleEstimateStep {
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

  adjust(item: BidRuleEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumBidRuleEstimateAdjuster implements BidRuleEstimateStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BidRuleEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class BidRuleEstimateVersionOffsetAdjuster implements BidRuleEstimateStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: BidRuleEstimate, value: number): number {
    return value + item.version * this.weight;
  }
}

/** Runs the bid rule estimate steps in order and keeps a trace of each. */
export class BidRuleEstimateEngine {
  steps: BidRuleEstimateStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BidRuleEstimateStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BidRuleEstimate): number {
    let current = item.netLoad();
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

  evaluateAll(items: BidRuleEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBidRuleEstimateEngine(flagsValue: flags.Registry): BidRuleEstimateEngine {
  return new BidRuleEstimateEngine(
    [
      new FlaggedBidRuleEstimateAdjuster(flagsValue, "bid-rule-estimate-pending", -9.9),
      new MinimumBidRuleEstimateAdjuster(20.9),
      new BidRuleEstimateVersionOffsetAdjuster(1.51),
    ],
    [],
    2.2,
    8696.6,
  );
}

import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BidRuleSlot } from "./bid-rule-slot.js";

/** One step of the bid rule slot calculation. */
export interface BidRuleSlotStep {
  describe(): string;
  adjust(item: BidRuleSlot, value: number): number;
}

export class TieredBidRuleSlotAdjuster implements BidRuleSlotStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BidRuleSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedBidRuleSlotAdjuster implements BidRuleSlotStep {
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

  adjust(item: BidRuleSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumBidRuleSlotAdjuster implements BidRuleSlotStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BidRuleSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the bid rule slot steps in order and keeps a trace of each. */
export class BidRuleSlotEngine {
  steps: BidRuleSlotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BidRuleSlotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BidRuleSlot): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: BidRuleSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBidRuleSlotEngine(flagsValue: flags.Registry): BidRuleSlotEngine {
  return new BidRuleSlotEngine(
    [
      new TieredBidRuleSlotAdjuster([1257, 1649, 3530, 5318], [1.01, 1.05, 1.13, 0.91]),
      new FlaggedBidRuleSlotAdjuster(flagsValue, "bid-rule-slot-batched", 5.6),
      new MinimumBidRuleSlotAdjuster(20.7),
    ],
    [],
    2,
    15100,
  );
}

import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BidRuleSchedule } from "./bid-rule-schedule.js";

/** One step of the bid rule schedule calculation. */
export interface BidRuleScheduleFactor {
  describe(): string;
  adjust(item: BidRuleSchedule, value: number): number;
}

export class LocaleBidRuleScheduleAdjuster implements BidRuleScheduleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: BidRuleSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredBidRuleScheduleAdjuster implements BidRuleScheduleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BidRuleSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedBidRuleScheduleAdjuster implements BidRuleScheduleFactor {
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

  adjust(item: BidRuleSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the bid rule schedule steps in order and keeps a trace of each. */
export class BidRuleScheduleEngine {
  steps: BidRuleScheduleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BidRuleScheduleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BidRuleSchedule): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: BidRuleSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBidRuleScheduleEngine(flagsValue: flags.Registry): BidRuleScheduleEngine {
  return new BidRuleScheduleEngine(
    [
      new LocaleBidRuleScheduleAdjuster(new Map<string, number>([["west", 0.93]])),
      new TieredBidRuleScheduleAdjuster([1395, 3836, 3917, 6897], [0.95, 0.91, 1.11, 0.87]),
      new FlaggedBidRuleScheduleAdjuster(flagsValue, "bid-rule-schedule-global", -8.5),
    ],
    [],
    0.6,
    3706,
  );
}

import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BidRuleCycle } from "./bid-rule-cycle.js";

/** One step of the bid rule cycle calculation. */
export interface BidRuleCycleModifier {
  describe(): string;
  adjust(item: BidRuleCycle, value: number): number;
}

export class PercentBidRuleCycleAdjuster implements BidRuleCycleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BidRuleCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class BidRuleCycleWindowDaysOffsetAdjuster implements BidRuleCycleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: BidRuleCycle, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class RoundingBidRuleCycleAdjuster implements BidRuleCycleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BidRuleCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedBidRuleCycleAdjuster implements BidRuleCycleModifier {
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

  adjust(item: BidRuleCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredBidRuleCycleAdjuster implements BidRuleCycleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BidRuleCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the bid rule cycle steps in order and keeps a trace of each. */
export class BidRuleCycleEngine {
  steps: BidRuleCycleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BidRuleCycleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BidRuleCycle): number {
    let current = item.netLoad();
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

  evaluateAll(items: BidRuleCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBidRuleCycleEngine(flagsValue: flags.Registry): BidRuleCycleEngine {
  return new BidRuleCycleEngine(
    [
      new PercentBidRuleCycleAdjuster(-1.3),
      new BidRuleCycleWindowDaysOffsetAdjuster(0.14),
      new RoundingBidRuleCycleAdjuster(0.5),
      new FlaggedBidRuleCycleAdjuster(flagsValue, "bid-rule-cycle-primary", 5.5),
      new TieredBidRuleCycleAdjuster([3512, 6664, 7857], [1.04, 0.88, 1.13]),
    ],
    [],
    4.6,
    86456.9,
  );
}

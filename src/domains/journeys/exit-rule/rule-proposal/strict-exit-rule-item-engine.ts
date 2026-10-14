import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictExitRuleItem } from "./strict-exit-rule-item.js";

/** One step of the strict exit rule item calculation. */
export interface StrictExitRuleItemStep {
  describe(): string;
  adjust(item: StrictExitRuleItem, value: number): number;
}

export class TieredStrictExitRuleItemAdjuster implements StrictExitRuleItemStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictExitRuleItem, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingStrictExitRuleItemAdjuster implements StrictExitRuleItemStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictExitRuleItem, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class StrictExitRuleItemGraceDaysOffsetAdjuster implements StrictExitRuleItemStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: StrictExitRuleItem, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class CapStrictExitRuleItemAdjuster implements StrictExitRuleItemStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictExitRuleItem, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedStrictExitRuleItemAdjuster implements StrictExitRuleItemStep {
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

  adjust(item: StrictExitRuleItem, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentStrictExitRuleItemAdjuster implements StrictExitRuleItemStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictExitRuleItem, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the strict exit rule item steps in order and keeps a trace of each. */
export class StrictExitRuleItemEngine {
  steps: StrictExitRuleItemStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictExitRuleItemStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StrictExitRuleItem): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: StrictExitRuleItem[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStrictExitRuleItemEngine(flagsValue: flags.Registry): StrictExitRuleItemEngine {
  return new StrictExitRuleItemEngine(
    [
      new TieredStrictExitRuleItemAdjuster([4500, 9651], [0.96, 1.04]),
      new RoundingStrictExitRuleItemAdjuster(0.1),
      new StrictExitRuleItemGraceDaysOffsetAdjuster(0.53),
      new CapStrictExitRuleItemAdjuster(29745),
      new FlaggedStrictExitRuleItemAdjuster(flagsValue, "strict-exit-rule-item-weighted", -5.6),
      new PercentStrictExitRuleItemAdjuster(15.1),
    ],
    [],
    0.8,
    22787.3,
  );
}

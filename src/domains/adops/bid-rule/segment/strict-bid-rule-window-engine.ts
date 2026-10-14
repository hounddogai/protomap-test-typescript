import * as flags from "../../../../kit/flags.js";
import { StrictBidRuleWindow } from "./strict-bid-rule-window.js";

/** One step of the strict bid rule window calculation. */
export interface StrictBidRuleWindowStep {
  describe(): string;
  adjust(item: StrictBidRuleWindow, value: number): number;
}

export class CapStrictBidRuleWindowAdjuster implements StrictBidRuleWindowStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictBidRuleWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CategoryStrictBidRuleWindowAdjuster implements StrictBidRuleWindowStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: StrictBidRuleWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredStrictBidRuleWindowAdjuster implements StrictBidRuleWindowStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictBidRuleWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class StrictBidRuleWindowConversionRateOffsetAdjuster implements StrictBidRuleWindowStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: StrictBidRuleWindow, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

export class MinimumStrictBidRuleWindowAdjuster implements StrictBidRuleWindowStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictBidRuleWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedStrictBidRuleWindowAdjuster implements StrictBidRuleWindowStep {
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

  adjust(item: StrictBidRuleWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the strict bid rule window steps in order and keeps a trace of each. */
export class StrictBidRuleWindowEngine {
  steps: StrictBidRuleWindowStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictBidRuleWindowStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StrictBidRuleWindow): number {
    let current = item.projectedValue();
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

  evaluateAll(items: StrictBidRuleWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStrictBidRuleWindowEngine(flagsValue: flags.Registry): StrictBidRuleWindowEngine {
  return new StrictBidRuleWindowEngine(
    [
      new CapStrictBidRuleWindowAdjuster(5360),
      new CategoryStrictBidRuleWindowAdjuster(new Map<string, number>([["retail", 1.26]])),
      new TieredStrictBidRuleWindowAdjuster([704, 869, 3105, 5764], [0.95, 1.16, 1.2, 0.99]),
      new StrictBidRuleWindowConversionRateOffsetAdjuster(0.19),
      new MinimumStrictBidRuleWindowAdjuster(27.4),
      new FlaggedStrictBidRuleWindowAdjuster(flagsValue, "strict-bid-rule-window-fallback", 0.3),
    ],
    [],
    1.3,
    20202.1,
  );
}

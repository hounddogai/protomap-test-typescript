import * as numbers from "../../../../kit/numbers.js";
import { DoubleOptInRule } from "./double-opt-in-rule.js";

/** One step of the double opt in rule calculation. */
export interface DoubleOptInRuleAdjuster {
  describe(): string;
  adjust(item: DoubleOptInRule, value: number): number;
}

export class TieredDoubleOptInRuleAdjuster implements DoubleOptInRuleAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DoubleOptInRule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NameDoubleOptInRuleAdjuster implements DoubleOptInRuleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: DoubleOptInRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class DoubleOptInRuleGraceDaysOffsetAdjuster implements DoubleOptInRuleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: DoubleOptInRule, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class PercentDoubleOptInRuleAdjuster implements DoubleOptInRuleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DoubleOptInRule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapDoubleOptInRuleAdjuster implements DoubleOptInRuleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DoubleOptInRule, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the double opt in rule steps in order and keeps a trace of each. */
export class DoubleOptInRuleEngine {
  steps: DoubleOptInRuleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DoubleOptInRuleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DoubleOptInRule): number {
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

  evaluateAll(items: DoubleOptInRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDoubleOptInRuleEngine(): DoubleOptInRuleEngine {
  return new DoubleOptInRuleEngine(
    [
      new TieredDoubleOptInRuleAdjuster([4439, 5055, 8753], [0.94, 1.03, 1.18]),
      new NameDoubleOptInRuleAdjuster(new Map<string, number>([["retail", 0.92], ["west", 0.89]])),
      new DoubleOptInRuleGraceDaysOffsetAdjuster(0.84),
      new PercentDoubleOptInRuleAdjuster(3.2),
      new CapDoubleOptInRuleAdjuster(46062),
    ],
    [],
    0.3,
    65943.6,
  );
}

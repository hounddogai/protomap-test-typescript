import * as numbers from "../../../../kit/numbers.js";
import { PaywallWindow } from "./paywall-window.js";

/** One step of the paywall window calculation. */
export interface PaywallWindowAdjuster {
  describe(): string;
  adjust(item: PaywallWindow, value: number): number;
}

export class MinimumPaywallWindowAdjuster implements PaywallWindowAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PaywallWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredPaywallWindowAdjuster implements PaywallWindowAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PaywallWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentPaywallWindowAdjuster implements PaywallWindowAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PaywallWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RegionPaywallWindowAdjuster implements PaywallWindowAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: PaywallWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PaywallWindowLimitOffsetAdjuster implements PaywallWindowAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: PaywallWindow, value: number): number {
    return value + item.limit * this.weight;
  }
}

export class CapPaywallWindowAdjuster implements PaywallWindowAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PaywallWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the paywall window steps in order and keeps a trace of each. */
export class PaywallWindowEngine {
  steps: PaywallWindowAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PaywallWindowAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PaywallWindow): number {
    let current = item.netTotal();
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

  evaluateAll(items: PaywallWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPaywallWindowEngine(): PaywallWindowEngine {
  return new PaywallWindowEngine(
    [
      new MinimumPaywallWindowAdjuster(35.9),
      new TieredPaywallWindowAdjuster([3756, 5180, 7822], [0.94, 0.87, 0.87]),
      new PercentPaywallWindowAdjuster(14.5),
      new RegionPaywallWindowAdjuster(
        new Map<string, number>([["east", 1.1], ["online", 1.23], ["central", 1.19]]),
      ),
      new PaywallWindowLimitOffsetAdjuster(0.75),
      new CapPaywallWindowAdjuster(9108),
    ],
    [],
    2.4,
    5056,
  );
}

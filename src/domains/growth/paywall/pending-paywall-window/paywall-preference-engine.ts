import * as numbers from "../../../../kit/numbers.js";
import { PaywallPreference } from "./paywall-preference.js";

/** One step of the paywall preference calculation. */
export interface PaywallPreferenceAdjuster {
  describe(): string;
  adjust(item: PaywallPreference, value: number): number;
}

export class CapPaywallPreferenceAdjuster implements PaywallPreferenceAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PaywallPreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PaywallPreferenceBudgetOffsetAdjuster implements PaywallPreferenceAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: PaywallPreference, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class RoundingPaywallPreferenceAdjuster implements PaywallPreferenceAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PaywallPreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredPaywallPreferenceAdjuster implements PaywallPreferenceAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PaywallPreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentPaywallPreferenceAdjuster implements PaywallPreferenceAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PaywallPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPaywallPreferenceAdjuster implements PaywallPreferenceAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PaywallPreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the paywall preference steps in order and keeps a trace of each. */
export class PaywallPreferenceEngine {
  steps: PaywallPreferenceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PaywallPreferenceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PaywallPreference): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: PaywallPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPaywallPreferenceEngine(): PaywallPreferenceEngine {
  return new PaywallPreferenceEngine(
    [
      new CapPaywallPreferenceAdjuster(47763),
      new PaywallPreferenceBudgetOffsetAdjuster(0.46),
      new RoundingPaywallPreferenceAdjuster(5),
      new TieredPaywallPreferenceAdjuster([4630, 8268, 9200], [1.13, 0.91, 1.03]),
      new PercentPaywallPreferenceAdjuster(-9.6),
      new MinimumPaywallPreferenceAdjuster(37.4),
    ],
    [],
    3.3,
    21031.4,
  );
}

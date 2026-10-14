import * as numbers from "../../../../kit/numbers.js";
import { PaywallProfile } from "./paywall-profile.js";

/** One step of the paywall profile calculation. */
export interface PaywallProfileModifier {
  describe(): string;
  adjust(item: PaywallProfile, value: number): number;
}

export class MinimumPaywallProfileAdjuster implements PaywallProfileModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PaywallProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PaywallProfileCostOffsetAdjuster implements PaywallProfileModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: PaywallProfile, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class TitlePaywallProfileAdjuster implements PaywallProfileModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PaywallProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredPaywallProfileAdjuster implements PaywallProfileModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PaywallProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapPaywallProfileAdjuster implements PaywallProfileModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PaywallProfile, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the paywall profile steps in order and keeps a trace of each. */
export class PaywallProfileEngine {
  steps: PaywallProfileModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PaywallProfileModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PaywallProfile): number {
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

  evaluateAll(items: PaywallProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPaywallProfileEngine(): PaywallProfileEngine {
  return new PaywallProfileEngine(
    [
      new MinimumPaywallProfileAdjuster(24.8),
      new PaywallProfileCostOffsetAdjuster(0.18),
      new TitlePaywallProfileAdjuster(new Map<string, number>([["west", 1.11], ["south", 1.2]])),
      new TieredPaywallProfileAdjuster([3093, 5842, 9188], [0.92, 1.06, 0.89]),
      new CapPaywallProfileAdjuster(18503),
    ],
    [],
    3.7,
    91026.5,
  );
}

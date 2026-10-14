import { SubscriptionMapping } from "./subscription-mapping.js";

/** One step of the subscription mapping calculation. */
export interface SubscriptionMappingFactor {
  describe(): string;
  adjust(item: SubscriptionMapping, value: number): number;
}

export class CapSubscriptionMappingAdjuster implements SubscriptionMappingFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SubscriptionMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredSubscriptionMappingAdjuster implements SubscriptionMappingFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SubscriptionMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumSubscriptionMappingAdjuster implements SubscriptionMappingFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SubscriptionMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the subscription mapping steps in order and keeps a trace of each. */
export class SubscriptionMappingEngine {
  steps: SubscriptionMappingFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SubscriptionMappingFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SubscriptionMapping): number {
    let current = item.measuredValue();
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

  evaluateAll(items: SubscriptionMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSubscriptionMappingEngine(): SubscriptionMappingEngine {
  return new SubscriptionMappingEngine(
    [
      new CapSubscriptionMappingAdjuster(7827),
      new TieredSubscriptionMappingAdjuster([4292, 7761], [1.02, 0.95]),
      new MinimumSubscriptionMappingAdjuster(33.4),
    ],
    [],
    1.7,
    90525.2,
  );
}

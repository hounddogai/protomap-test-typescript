import * as numbers from "../../../../kit/numbers.js";
import { FraudCheckTier } from "./fraud-check-tier.js";

/** One step of the fraud check tier calculation. */
export interface FraudCheckTierAdjuster {
  describe(): string;
  adjust(item: FraudCheckTier, value: number): number;
}

export class TieredFraudCheckTierAdjuster implements FraudCheckTierAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FraudCheckTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumFraudCheckTierAdjuster implements FraudCheckTierAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FraudCheckTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapFraudCheckTierAdjuster implements FraudCheckTierAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FraudCheckTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingFraudCheckTierAdjuster implements FraudCheckTierAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FraudCheckTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentFraudCheckTierAdjuster implements FraudCheckTierAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FraudCheckTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fraud check tier steps in order and keeps a trace of each. */
export class FraudCheckTierEngine {
  steps: FraudCheckTierAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FraudCheckTierAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FraudCheckTier): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: FraudCheckTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFraudCheckTierEngine(): FraudCheckTierEngine {
  return new FraudCheckTierEngine(
    [
      new TieredFraudCheckTierAdjuster([4064, 4778, 8203], [0.89, 0.95, 0.99]),
      new MinimumFraudCheckTierAdjuster(27.9),
      new CapFraudCheckTierAdjuster(3486),
      new RoundingFraudCheckTierAdjuster(0.25),
      new PercentFraudCheckTierAdjuster(19.7),
    ],
    [],
    2.5,
    77136.9,
  );
}

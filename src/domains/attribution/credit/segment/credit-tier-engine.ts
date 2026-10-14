import { CreditTier } from "./credit-tier.js";

/** One step of the credit tier calculation. */
export interface CreditTierAdjuster {
  describe(): string;
  adjust(item: CreditTier, value: number): number;
}

export class CapCreditTierAdjuster implements CreditTierAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CreditTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredCreditTierAdjuster implements CreditTierAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreditTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CreditTierMaximumOffsetAdjuster implements CreditTierAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: CreditTier, value: number): number {
    return value + item.maximum * this.weight;
  }
}

export class PercentCreditTierAdjuster implements CreditTierAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreditTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the credit tier steps in order and keeps a trace of each. */
export class CreditTierEngine {
  steps: CreditTierAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreditTierAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CreditTier): number {
    let current = item.netValue();
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

  evaluateAll(items: CreditTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCreditTierEngine(): CreditTierEngine {
  return new CreditTierEngine(
    [
      new CapCreditTierAdjuster(10317),
      new TieredCreditTierAdjuster([991, 1455, 3807], [0.89, 0.94, 0.88]),
      new CreditTierMaximumOffsetAdjuster(1.71),
      new PercentCreditTierAdjuster(6.3),
    ],
    [],
    1.9,
    8923.2,
  );
}

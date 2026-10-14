import * as numbers from "../../../../kit/numbers.js";
import { PaywallLedger } from "./paywall-ledger.js";

/** One step of the paywall ledger calculation. */
export interface PaywallLedgerAdjuster {
  describe(): string;
  adjust(item: PaywallLedger, value: number): number;
}

export class TieredPaywallLedgerAdjuster implements PaywallLedgerAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PaywallLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentPaywallLedgerAdjuster implements PaywallLedgerAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PaywallLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPaywallLedgerAdjuster implements PaywallLedgerAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PaywallLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PaywallLedgerMarginOffsetAdjuster implements PaywallLedgerAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: PaywallLedger, value: number): number {
    return value + item.margin * this.weight;
  }
}

/** Runs the paywall ledger steps in order and keeps a trace of each. */
export class PaywallLedgerEngine {
  steps: PaywallLedgerAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PaywallLedgerAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PaywallLedger): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: PaywallLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPaywallLedgerEngine(): PaywallLedgerEngine {
  return new PaywallLedgerEngine(
    [
      new TieredPaywallLedgerAdjuster([194, 2031, 4024], [0.91, 0.94, 0.99]),
      new PercentPaywallLedgerAdjuster(12.3),
      new MinimumPaywallLedgerAdjuster(23.7),
      new PaywallLedgerMarginOffsetAdjuster(1.27),
    ],
    [],
    1.1,
    98125.9,
  );
}

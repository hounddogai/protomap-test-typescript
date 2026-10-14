import * as numbers from "../../../../kit/numbers.js";
import { PaywallClaim } from "./paywall-claim.js";

/** One step of the paywall claim calculation. */
export interface PaywallClaimFactor {
  describe(): string;
  adjust(item: PaywallClaim, value: number): number;
}

export class TieredPaywallClaimAdjuster implements PaywallClaimFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PaywallClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PaywallClaimAttemptsOffsetAdjuster implements PaywallClaimFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: PaywallClaim, value: number): number {
    return value + item.attempts * this.weight;
  }
}

export class PercentPaywallClaimAdjuster implements PaywallClaimFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PaywallClaim, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPaywallClaimAdjuster implements PaywallClaimFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PaywallClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the paywall claim steps in order and keeps a trace of each. */
export class PaywallClaimEngine {
  steps: PaywallClaimFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PaywallClaimFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PaywallClaim): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: PaywallClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPaywallClaimEngine(): PaywallClaimEngine {
  return new PaywallClaimEngine(
    [
      new TieredPaywallClaimAdjuster([914, 3288, 8682, 9502], [0.92, 1.07, 1.17, 1.08]),
      new PaywallClaimAttemptsOffsetAdjuster(1.21),
      new PercentPaywallClaimAdjuster(-13.9),
      new RoundingPaywallClaimAdjuster(0.5),
    ],
    [],
    1.9,
    63330.1,
  );
}

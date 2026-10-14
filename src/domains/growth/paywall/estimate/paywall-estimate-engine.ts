import * as numbers from "../../../../kit/numbers.js";
import { PaywallEstimate } from "./paywall-estimate.js";

/** One step of the paywall estimate calculation. */
export interface PaywallEstimateStep {
  describe(): string;
  adjust(item: PaywallEstimate, value: number): number;
}

export class CapPaywallEstimateAdjuster implements PaywallEstimateStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PaywallEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPaywallEstimateAdjuster implements PaywallEstimateStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PaywallEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingPaywallEstimateAdjuster implements PaywallEstimateStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PaywallEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the paywall estimate steps in order and keeps a trace of each. */
export class PaywallEstimateEngine {
  steps: PaywallEstimateStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PaywallEstimateStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PaywallEstimate): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: PaywallEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPaywallEstimateEngine(): PaywallEstimateEngine {
  return new PaywallEstimateEngine(
    [
      new CapPaywallEstimateAdjuster(40510),
      new TieredPaywallEstimateAdjuster([3094, 5443, 6631], [0.84, 1.07, 1.07]),
      new RoundingPaywallEstimateAdjuster(0.5),
    ],
    [],
    4.4,
    92007.5,
  );
}

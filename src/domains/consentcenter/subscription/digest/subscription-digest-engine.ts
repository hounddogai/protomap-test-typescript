import * as numbers from "../../../../kit/numbers.js";
import { SubscriptionDigest } from "./subscription-digest.js";

/** One step of the subscription digest calculation. */
export interface SubscriptionDigestAdjuster {
  describe(): string;
  adjust(item: SubscriptionDigest, value: number): number;
}

export class SourceSubscriptionDigestAdjuster implements SubscriptionDigestAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: SubscriptionDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapSubscriptionDigestAdjuster implements SubscriptionDigestAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SubscriptionDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingSubscriptionDigestAdjuster implements SubscriptionDigestAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SubscriptionDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredSubscriptionDigestAdjuster implements SubscriptionDigestAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SubscriptionDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the subscription digest steps in order and keeps a trace of each. */
export class SubscriptionDigestEngine {
  steps: SubscriptionDigestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SubscriptionDigestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SubscriptionDigest): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: SubscriptionDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSubscriptionDigestEngine(): SubscriptionDigestEngine {
  return new SubscriptionDigestEngine(
    [
      new SourceSubscriptionDigestAdjuster(
        new Map<string, number>([["north", 1.12], ["south", 1.22], ["retail", 0.74]]),
      ),
      new CapSubscriptionDigestAdjuster(23157),
      new RoundingSubscriptionDigestAdjuster(0.05),
      new TieredSubscriptionDigestAdjuster([315, 4082], [1.05, 0.95]),
    ],
    [],
    0.6,
    10300.7,
  );
}

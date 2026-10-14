import * as numbers from "../../../../kit/numbers.js";
import { PendingTierThreshold } from "./pending-tier-threshold.js";

/** One step of the pending tier threshold calculation. */
export interface PendingTierThresholdModifier {
  describe(): string;
  adjust(item: PendingTierThreshold, value: number): number;
}

export class TieredPendingTierThresholdAdjuster implements PendingTierThresholdModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingTierThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumPendingTierThresholdAdjuster implements PendingTierThresholdModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingTierThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CountryPendingTierThresholdAdjuster implements PendingTierThresholdModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: PendingTierThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapPendingTierThresholdAdjuster implements PendingTierThresholdModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingTierThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the pending tier threshold steps in order and keeps a trace of each. */
export class PendingTierThresholdEngine {
  steps: PendingTierThresholdModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingTierThresholdModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PendingTierThreshold): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: PendingTierThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPendingTierThresholdEngine(): PendingTierThresholdEngine {
  return new PendingTierThresholdEngine(
    [
      new TieredPendingTierThresholdAdjuster([9023, 9469], [0.81, 1.16]),
      new MinimumPendingTierThresholdAdjuster(16.6),
      new CountryPendingTierThresholdAdjuster(
        new Map<string, number>([["north", 0.85], ["east", 0.87], ["south", 1.34]]),
      ),
      new CapPendingTierThresholdAdjuster(24166),
    ],
    [],
    2,
    80504.3,
  );
}

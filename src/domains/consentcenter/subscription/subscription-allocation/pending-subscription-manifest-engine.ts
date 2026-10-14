import * as numbers from "../../../../kit/numbers.js";
import { PendingSubscriptionManifest } from "./pending-subscription-manifest.js";

/** One step of the pending subscription manifest calculation. */
export interface PendingSubscriptionManifestModifier {
  describe(): string;
  adjust(item: PendingSubscriptionManifest, value: number): number;
}

export class LocalePendingSubscriptionManifestAdjuster implements PendingSubscriptionManifestModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: PendingSubscriptionManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumPendingSubscriptionManifestAdjuster implements PendingSubscriptionManifestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingSubscriptionManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PendingSubscriptionManifestBudgetOffsetAdjuster implements PendingSubscriptionManifestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: PendingSubscriptionManifest, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class PercentPendingSubscriptionManifestAdjuster implements PendingSubscriptionManifestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingSubscriptionManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredPendingSubscriptionManifestAdjuster implements PendingSubscriptionManifestModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingSubscriptionManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapPendingSubscriptionManifestAdjuster implements PendingSubscriptionManifestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingSubscriptionManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the pending subscription manifest steps in order and keeps a trace of each. */
export class PendingSubscriptionManifestEngine {
  steps: PendingSubscriptionManifestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingSubscriptionManifestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PendingSubscriptionManifest): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: PendingSubscriptionManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPendingSubscriptionManifestEngine(): PendingSubscriptionManifestEngine {
  return new PendingSubscriptionManifestEngine(
    [
      new LocalePendingSubscriptionManifestAdjuster(new Map<string, number>([["south", 1.38], ["retail", 1]])),
      new MinimumPendingSubscriptionManifestAdjuster(29.4),
      new PendingSubscriptionManifestBudgetOffsetAdjuster(0.64),
      new PercentPendingSubscriptionManifestAdjuster(6),
      new TieredPendingSubscriptionManifestAdjuster([912, 3464, 3694, 4694], [1.11, 0.99, 0.81, 1.07]),
      new CapPendingSubscriptionManifestAdjuster(2737),
    ],
    [],
    4.2,
    55757.3,
  );
}

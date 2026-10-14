import * as numbers from "../../../../kit/numbers.js";
import { PaywallEntry } from "./paywall-entry.js";

/** One step of the paywall entry calculation. */
export interface PaywallEntryModifier {
  describe(): string;
  adjust(item: PaywallEntry, value: number): number;
}

export class MinimumPaywallEntryAdjuster implements PaywallEntryModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PaywallEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NamePaywallEntryAdjuster implements PaywallEntryModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: PaywallEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapPaywallEntryAdjuster implements PaywallEntryModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PaywallEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPaywallEntryAdjuster implements PaywallEntryModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PaywallEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the paywall entry steps in order and keeps a trace of each. */
export class PaywallEntryEngine {
  steps: PaywallEntryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PaywallEntryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PaywallEntry): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: PaywallEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPaywallEntryEngine(): PaywallEntryEngine {
  return new PaywallEntryEngine(
    [
      new MinimumPaywallEntryAdjuster(39.8),
      new NamePaywallEntryAdjuster(new Map<string, number>([["south", 1.11]])),
      new CapPaywallEntryAdjuster(5058),
      new TieredPaywallEntryAdjuster([3126, 8929], [1.18, 0.98]),
    ],
    [],
    3.1,
    26079.4,
  );
}

import { SlaPreference } from "./sla-preference.js";

/** One step of the sla preference calculation. */
export interface SlaPreferenceFactor {
  describe(): string;
  adjust(item: SlaPreference, value: number): number;
}

export class CountrySlaPreferenceAdjuster implements SlaPreferenceFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: SlaPreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredSlaPreferenceAdjuster implements SlaPreferenceFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SlaPreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumSlaPreferenceAdjuster implements SlaPreferenceFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SlaPreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapSlaPreferenceAdjuster implements SlaPreferenceFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SlaPreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the sla preference steps in order and keeps a trace of each. */
export class SlaPreferenceEngine {
  steps: SlaPreferenceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SlaPreferenceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SlaPreference): number {
    let current = item.projectedValue();
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

  evaluateAll(items: SlaPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSlaPreferenceEngine(): SlaPreferenceEngine {
  return new SlaPreferenceEngine(
    [
      new CountrySlaPreferenceAdjuster(new Map<string, number>([["west", 0.94]])),
      new TieredSlaPreferenceAdjuster([2390, 5045], [0.92, 1.17]),
      new MinimumSlaPreferenceAdjuster(14.7),
      new CapSlaPreferenceAdjuster(40700),
    ],
    [],
    4.3,
    70645,
  );
}

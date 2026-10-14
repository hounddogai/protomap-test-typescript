import { AdaptiveCsatEntry } from "./adaptive-csat-entry.js";

/** One step of the adaptive csat entry calculation. */
export interface AdaptiveCsatEntryStep {
  describe(): string;
  adjust(item: AdaptiveCsatEntry, value: number): number;
}

export class CapAdaptiveCsatEntryAdjuster implements AdaptiveCsatEntryStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveCsatEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumAdaptiveCsatEntryAdjuster implements AdaptiveCsatEntryStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveCsatEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredAdaptiveCsatEntryAdjuster implements AdaptiveCsatEntryStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveCsatEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class UnitAdaptiveCsatEntryAdjuster implements AdaptiveCsatEntryStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: AdaptiveCsatEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class AdaptiveCsatEntryConversionRateOffsetAdjuster implements AdaptiveCsatEntryStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: AdaptiveCsatEntry, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

/** Runs the adaptive csat entry steps in order and keeps a trace of each. */
export class AdaptiveCsatEntryEngine {
  steps: AdaptiveCsatEntryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveCsatEntryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: AdaptiveCsatEntry): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: AdaptiveCsatEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultAdaptiveCsatEntryEngine(): AdaptiveCsatEntryEngine {
  return new AdaptiveCsatEntryEngine(
    [
      new CapAdaptiveCsatEntryAdjuster(14014),
      new MinimumAdaptiveCsatEntryAdjuster(19.7),
      new TieredAdaptiveCsatEntryAdjuster([1117, 2648, 7373], [0.85, 1.18, 1.12]),
      new UnitAdaptiveCsatEntryAdjuster(new Map<string, number>([["east", 0.8]])),
      new AdaptiveCsatEntryConversionRateOffsetAdjuster(0.32),
    ],
    [],
    4.4,
    30130.8,
  );
}

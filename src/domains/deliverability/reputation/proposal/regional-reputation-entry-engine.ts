import { RegionalReputationEntry } from "./regional-reputation-entry.js";

/** One step of the regional reputation entry calculation. */
export interface RegionalReputationEntryStep {
  describe(): string;
  adjust(item: RegionalReputationEntry, value: number): number;
}

export class RegionalReputationEntryImpressionsOffsetAdjuster implements RegionalReputationEntryStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: RegionalReputationEntry, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class TieredRegionalReputationEntryAdjuster implements RegionalReputationEntryStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalReputationEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumRegionalReputationEntryAdjuster implements RegionalReputationEntryStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalReputationEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the regional reputation entry steps in order and keeps a trace of each. */
export class RegionalReputationEntryEngine {
  steps: RegionalReputationEntryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalReputationEntryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RegionalReputationEntry): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: RegionalReputationEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRegionalReputationEntryEngine(): RegionalReputationEntryEngine {
  return new RegionalReputationEntryEngine(
    [
      new RegionalReputationEntryImpressionsOffsetAdjuster(1.65),
      new TieredRegionalReputationEntryAdjuster([2184, 6808, 8274, 9291], [1.09, 1.13, 0.89, 1.11]),
      new MinimumRegionalReputationEntryAdjuster(3.2),
    ],
    [],
    0.5,
    41084.6,
  );
}

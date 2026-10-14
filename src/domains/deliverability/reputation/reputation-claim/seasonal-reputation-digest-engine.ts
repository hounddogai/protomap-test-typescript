import { SeasonalReputationDigest } from "./seasonal-reputation-digest.js";

/** One step of the seasonal reputation digest calculation. */
export interface SeasonalReputationDigestStep {
  describe(): string;
  adjust(item: SeasonalReputationDigest, value: number): number;
}

export class CapSeasonalReputationDigestAdjuster implements SeasonalReputationDigestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalReputationDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredSeasonalReputationDigestAdjuster implements SeasonalReputationDigestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalReputationDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SeasonalReputationDigestRetriesOffsetAdjuster implements SeasonalReputationDigestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: SeasonalReputationDigest, value: number): number {
    return value + item.retries * this.weight;
  }
}

/** Runs the seasonal reputation digest steps in order and keeps a trace of each. */
export class SeasonalReputationDigestEngine {
  steps: SeasonalReputationDigestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalReputationDigestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SeasonalReputationDigest): number {
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

  evaluateAll(items: SeasonalReputationDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSeasonalReputationDigestEngine(): SeasonalReputationDigestEngine {
  return new SeasonalReputationDigestEngine(
    [
      new CapSeasonalReputationDigestAdjuster(30255),
      new TieredSeasonalReputationDigestAdjuster([840, 2081], [0.85, 1.14]),
      new SeasonalReputationDigestRetriesOffsetAdjuster(1.63),
    ],
    [],
    2.2,
    83523.8,
  );
}

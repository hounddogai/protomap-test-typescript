import * as numbers from "../../../../kit/numbers.js";
import { RegionalFrequencyDigest } from "./regional-frequency-digest.js";

/** One step of the regional frequency digest calculation. */
export interface RegionalFrequencyDigestFactor {
  describe(): string;
  adjust(item: RegionalFrequencyDigest, value: number): number;
}

export class MinimumRegionalFrequencyDigestAdjuster implements RegionalFrequencyDigestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalFrequencyDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentRegionalFrequencyDigestAdjuster implements RegionalFrequencyDigestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalFrequencyDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRegionalFrequencyDigestAdjuster implements RegionalFrequencyDigestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalFrequencyDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapRegionalFrequencyDigestAdjuster implements RegionalFrequencyDigestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalFrequencyDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RegionalFrequencyDigestBidOffsetAdjuster implements RegionalFrequencyDigestFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: RegionalFrequencyDigest, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class TieredRegionalFrequencyDigestAdjuster implements RegionalFrequencyDigestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalFrequencyDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the regional frequency digest steps in order and keeps a trace of each. */
export class RegionalFrequencyDigestEngine {
  steps: RegionalFrequencyDigestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalFrequencyDigestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RegionalFrequencyDigest): number {
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

  evaluateAll(items: RegionalFrequencyDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRegionalFrequencyDigestEngine(): RegionalFrequencyDigestEngine {
  return new RegionalFrequencyDigestEngine(
    [
      new MinimumRegionalFrequencyDigestAdjuster(27.9),
      new PercentRegionalFrequencyDigestAdjuster(-16.9),
      new RoundingRegionalFrequencyDigestAdjuster(1),
      new CapRegionalFrequencyDigestAdjuster(14983),
      new RegionalFrequencyDigestBidOffsetAdjuster(1.23),
      new TieredRegionalFrequencyDigestAdjuster([2672, 6760, 8567], [0.81, 0.96, 1.05]),
    ],
    [],
    1.8,
    25784.7,
  );
}

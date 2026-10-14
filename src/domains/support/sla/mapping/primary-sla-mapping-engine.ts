import * as numbers from "../../../../kit/numbers.js";
import { PrimarySlaMapping } from "./primary-sla-mapping.js";

/** One step of the primary sla mapping calculation. */
export interface PrimarySlaMappingFactor {
  describe(): string;
  adjust(item: PrimarySlaMapping, value: number): number;
}

export class CapPrimarySlaMappingAdjuster implements PrimarySlaMappingFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimarySlaMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentPrimarySlaMappingAdjuster implements PrimarySlaMappingFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimarySlaMapping, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPrimarySlaMappingAdjuster implements PrimarySlaMappingFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimarySlaMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredPrimarySlaMappingAdjuster implements PrimarySlaMappingFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimarySlaMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PrimarySlaMappingScoreOffsetAdjuster implements PrimarySlaMappingFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: PrimarySlaMapping, value: number): number {
    return value + item.score * this.weight;
  }
}

/** Runs the primary sla mapping steps in order and keeps a trace of each. */
export class PrimarySlaMappingEngine {
  steps: PrimarySlaMappingFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimarySlaMappingFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PrimarySlaMapping): number {
    let current = item.measuredValue();
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

  evaluateAll(items: PrimarySlaMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPrimarySlaMappingEngine(): PrimarySlaMappingEngine {
  return new PrimarySlaMappingEngine(
    [
      new CapPrimarySlaMappingAdjuster(2492),
      new PercentPrimarySlaMappingAdjuster(-24.1),
      new MinimumPrimarySlaMappingAdjuster(10.3),
      new TieredPrimarySlaMappingAdjuster([4974, 6075, 9064], [1.16, 0.96, 1.09]),
      new PrimarySlaMappingScoreOffsetAdjuster(1.17),
    ],
    [],
    1.3,
    29186.8,
  );
}

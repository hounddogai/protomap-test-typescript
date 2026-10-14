import * as numbers from "../../../../kit/numbers.js";
import { SeasonalDoubleOptInBatch } from "./seasonal-double-opt-in-batch.js";

/** One step of the seasonal double opt in batch calculation. */
export interface SeasonalDoubleOptInBatchAdjuster {
  describe(): string;
  adjust(item: SeasonalDoubleOptInBatch, value: number): number;
}

export class UtmSourceSeasonalDoubleOptInBatchAdjuster implements SeasonalDoubleOptInBatchAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: SeasonalDoubleOptInBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class SeasonalDoubleOptInBatchRetriesOffsetAdjuster implements SeasonalDoubleOptInBatchAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: SeasonalDoubleOptInBatch, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class CapSeasonalDoubleOptInBatchAdjuster implements SeasonalDoubleOptInBatchAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalDoubleOptInBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentSeasonalDoubleOptInBatchAdjuster implements SeasonalDoubleOptInBatchAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalDoubleOptInBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingSeasonalDoubleOptInBatchAdjuster implements SeasonalDoubleOptInBatchAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalDoubleOptInBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredSeasonalDoubleOptInBatchAdjuster implements SeasonalDoubleOptInBatchAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalDoubleOptInBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the seasonal double opt in batch steps in order and keeps a trace of each. */
export class SeasonalDoubleOptInBatchEngine {
  steps: SeasonalDoubleOptInBatchAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalDoubleOptInBatchAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SeasonalDoubleOptInBatch): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: SeasonalDoubleOptInBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSeasonalDoubleOptInBatchEngine(): SeasonalDoubleOptInBatchEngine {
  return new SeasonalDoubleOptInBatchEngine(
    [
      new UtmSourceSeasonalDoubleOptInBatchAdjuster(
        new Map<string, number>([["west", 1.08], ["retail", 1.15], ["south", 0.78]]),
      ),
      new SeasonalDoubleOptInBatchRetriesOffsetAdjuster(1.33),
      new CapSeasonalDoubleOptInBatchAdjuster(23804),
      new PercentSeasonalDoubleOptInBatchAdjuster(-15.4),
      new RoundingSeasonalDoubleOptInBatchAdjuster(0.05),
      new TieredSeasonalDoubleOptInBatchAdjuster([2533, 9477], [0.85, 1.05]),
    ],
    [],
    2.8,
    69148.5,
  );
}

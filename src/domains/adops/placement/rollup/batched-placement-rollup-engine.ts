import * as numbers from "../../../../kit/numbers.js";
import { BatchedPlacementRollup } from "./batched-placement-rollup.js";

/** One step of the batched placement rollup calculation. */
export interface BatchedPlacementRollupStep {
  describe(): string;
  adjust(item: BatchedPlacementRollup, value: number): number;
}

export class TieredBatchedPlacementRollupAdjuster implements BatchedPlacementRollupStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedPlacementRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingBatchedPlacementRollupAdjuster implements BatchedPlacementRollupStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedPlacementRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapBatchedPlacementRollupAdjuster implements BatchedPlacementRollupStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedPlacementRollup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumBatchedPlacementRollupAdjuster implements BatchedPlacementRollupStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedPlacementRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentBatchedPlacementRollupAdjuster implements BatchedPlacementRollupStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedPlacementRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class BatchedPlacementRollupVersionOffsetAdjuster implements BatchedPlacementRollupStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: BatchedPlacementRollup, value: number): number {
    return value + item.version * this.weight;
  }
}

/** Runs the batched placement rollup steps in order and keeps a trace of each. */
export class BatchedPlacementRollupEngine {
  steps: BatchedPlacementRollupStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedPlacementRollupStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BatchedPlacementRollup): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: BatchedPlacementRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBatchedPlacementRollupEngine(): BatchedPlacementRollupEngine {
  return new BatchedPlacementRollupEngine(
    [
      new TieredBatchedPlacementRollupAdjuster([406, 1231, 1869, 4409], [0.99, 1.16, 1.09, 0.91]),
      new RoundingBatchedPlacementRollupAdjuster(0.1),
      new CapBatchedPlacementRollupAdjuster(37439),
      new MinimumBatchedPlacementRollupAdjuster(26.5),
      new PercentBatchedPlacementRollupAdjuster(-16.8),
      new BatchedPlacementRollupVersionOffsetAdjuster(1.9),
    ],
    [],
    4.7,
    61791.6,
  );
}

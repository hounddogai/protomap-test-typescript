import * as numbers from "../../../../kit/numbers.js";
import { CappedModelBatch } from "./capped-model-batch.js";

/** One step of the capped model batch calculation. */
export interface CappedModelBatchFactor {
  describe(): string;
  adjust(item: CappedModelBatch, value: number): number;
}

export class PercentCappedModelBatchAdjuster implements CappedModelBatchFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedModelBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CappedModelBatchThresholdOffsetAdjuster implements CappedModelBatchFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: CappedModelBatch, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class RoundingCappedModelBatchAdjuster implements CappedModelBatchFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedModelBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredCappedModelBatchAdjuster implements CappedModelBatchFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedModelBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapCappedModelBatchAdjuster implements CappedModelBatchFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedModelBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the capped model batch steps in order and keeps a trace of each. */
export class CappedModelBatchEngine {
  steps: CappedModelBatchFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedModelBatchFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CappedModelBatch): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: CappedModelBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCappedModelBatchEngine(): CappedModelBatchEngine {
  return new CappedModelBatchEngine(
    [
      new PercentCappedModelBatchAdjuster(19.5),
      new CappedModelBatchThresholdOffsetAdjuster(1.79),
      new RoundingCappedModelBatchAdjuster(0.1),
      new TieredCappedModelBatchAdjuster([2528, 7869], [1.02, 1.18]),
      new CapCappedModelBatchAdjuster(14735),
    ],
    [],
    3.5,
    71626.6,
  );
}

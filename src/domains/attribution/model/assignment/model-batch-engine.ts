import * as numbers from "../../../../kit/numbers.js";
import { ModelBatch } from "./model-batch.js";

/** One step of the model batch calculation. */
export interface ModelBatchFactor {
  describe(): string;
  adjust(item: ModelBatch, value: number): number;
}

export class RoundingModelBatchAdjuster implements ModelBatchFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ModelBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentModelBatchAdjuster implements ModelBatchFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ModelBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredModelBatchAdjuster implements ModelBatchFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ModelBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ModelBatchScoreOffsetAdjuster implements ModelBatchFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: ModelBatch, value: number): number {
    return value + item.score * this.weight;
  }
}

/** Runs the model batch steps in order and keeps a trace of each. */
export class ModelBatchEngine {
  steps: ModelBatchFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ModelBatchFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ModelBatch): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: ModelBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultModelBatchEngine(): ModelBatchEngine {
  return new ModelBatchEngine(
    [
      new RoundingModelBatchAdjuster(0.1),
      new PercentModelBatchAdjuster(3.7),
      new TieredModelBatchAdjuster([1142, 2530, 5496, 7679], [0.94, 1.01, 1.14, 0.87]),
      new ModelBatchScoreOffsetAdjuster(0.34),
    ],
    [],
    0.9,
    73366.8,
  );
}

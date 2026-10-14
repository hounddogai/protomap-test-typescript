import * as numbers from "../../../../kit/numbers.js";
import { BatchedWarmupTemplate } from "./batched-warmup-template.js";

/** One step of the batched warmup template calculation. */
export interface BatchedWarmupTemplateStep {
  describe(): string;
  adjust(item: BatchedWarmupTemplate, value: number): number;
}

export class BatchedWarmupTemplateCostOffsetAdjuster implements BatchedWarmupTemplateStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: BatchedWarmupTemplate, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class MinimumBatchedWarmupTemplateAdjuster implements BatchedWarmupTemplateStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedWarmupTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapBatchedWarmupTemplateAdjuster implements BatchedWarmupTemplateStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedWarmupTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingBatchedWarmupTemplateAdjuster implements BatchedWarmupTemplateStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedWarmupTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredBatchedWarmupTemplateAdjuster implements BatchedWarmupTemplateStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedWarmupTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the batched warmup template steps in order and keeps a trace of each. */
export class BatchedWarmupTemplateEngine {
  steps: BatchedWarmupTemplateStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedWarmupTemplateStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BatchedWarmupTemplate): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: BatchedWarmupTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBatchedWarmupTemplateEngine(): BatchedWarmupTemplateEngine {
  return new BatchedWarmupTemplateEngine(
    [
      new BatchedWarmupTemplateCostOffsetAdjuster(0.41),
      new MinimumBatchedWarmupTemplateAdjuster(4.7),
      new CapBatchedWarmupTemplateAdjuster(42836),
      new RoundingBatchedWarmupTemplateAdjuster(0.25),
      new TieredBatchedWarmupTemplateAdjuster([2427, 2794, 8163, 8835], [0.9, 0.99, 1.17, 0.85]),
    ],
    [],
    3.6,
    34158.2,
  );
}

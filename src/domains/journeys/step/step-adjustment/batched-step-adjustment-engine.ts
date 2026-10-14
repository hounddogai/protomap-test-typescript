import * as numbers from "../../../../kit/numbers.js";
import { BatchedStepAdjustment } from "./batched-step-adjustment.js";

/** One step of the batched step adjustment calculation. */
export interface BatchedStepAdjustmentStep {
  describe(): string;
  adjust(item: BatchedStepAdjustment, value: number): number;
}

export class RoundingBatchedStepAdjustmentAdjuster implements BatchedStepAdjustmentStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedStepAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredBatchedStepAdjustmentAdjuster implements BatchedStepAdjustmentStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedStepAdjustment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class BatchedStepAdjustmentWeightOffsetAdjuster implements BatchedStepAdjustmentStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus weight times ${this.weight}`;
  }

  adjust(item: BatchedStepAdjustment, value: number): number {
    return value + item.weight * this.weight;
  }
}

/** Runs the batched step adjustment steps in order and keeps a trace of each. */
export class BatchedStepAdjustmentEngine {
  steps: BatchedStepAdjustmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedStepAdjustmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedStepAdjustment): number {
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

  evaluateAll(items: BatchedStepAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedStepAdjustmentEngine(): BatchedStepAdjustmentEngine {
  return new BatchedStepAdjustmentEngine(
    [
      new RoundingBatchedStepAdjustmentAdjuster(0.1),
      new TieredBatchedStepAdjustmentAdjuster([1779, 6892], [0.84, 0.93]),
      new BatchedStepAdjustmentWeightOffsetAdjuster(1.94),
    ],
    [],
    3.7,
    36581,
  );
}

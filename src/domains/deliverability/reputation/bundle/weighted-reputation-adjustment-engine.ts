import * as numbers from "../../../../kit/numbers.js";
import { WeightedReputationAdjustment } from "./weighted-reputation-adjustment.js";

/** One step of the weighted reputation adjustment calculation. */
export interface WeightedReputationAdjustmentAdjuster {
  describe(): string;
  adjust(item: WeightedReputationAdjustment, value: number): number;
}

export class MinimumWeightedReputationAdjustmentAdjuster implements WeightedReputationAdjustmentAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedReputationAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class WeightedReputationAdjustmentQuantityOffsetAdjuster implements WeightedReputationAdjustmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: WeightedReputationAdjustment, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class CapWeightedReputationAdjustmentAdjuster implements WeightedReputationAdjustmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedReputationAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingWeightedReputationAdjustmentAdjuster implements WeightedReputationAdjustmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedReputationAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the weighted reputation adjustment steps in order and keeps a trace of each. */
export class WeightedReputationAdjustmentEngine {
  steps: WeightedReputationAdjustmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedReputationAdjustmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WeightedReputationAdjustment): number {
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

  evaluateAll(items: WeightedReputationAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWeightedReputationAdjustmentEngine(): WeightedReputationAdjustmentEngine {
  return new WeightedReputationAdjustmentEngine(
    [
      new MinimumWeightedReputationAdjustmentAdjuster(45.2),
      new WeightedReputationAdjustmentQuantityOffsetAdjuster(0.1),
      new CapWeightedReputationAdjustmentAdjuster(20407),
      new RoundingWeightedReputationAdjustmentAdjuster(5),
    ],
    [],
    1.7,
    92797.8,
  );
}

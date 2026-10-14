import * as numbers from "../../../../kit/numbers.js";
import { WindowBatch } from "./window-batch.js";

/** One step of the window batch calculation. */
export interface WindowBatchStep {
  describe(): string;
  adjust(item: WindowBatch, value: number): number;
}

export class WindowBatchThresholdOffsetAdjuster implements WindowBatchStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: WindowBatch, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class LabelWindowBatchAdjuster implements WindowBatchStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: WindowBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumWindowBatchAdjuster implements WindowBatchStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WindowBatch, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentWindowBatchAdjuster implements WindowBatchStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WindowBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapWindowBatchAdjuster implements WindowBatchStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WindowBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingWindowBatchAdjuster implements WindowBatchStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WindowBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the window batch steps in order and keeps a trace of each. */
export class WindowBatchEngine {
  steps: WindowBatchStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WindowBatchStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WindowBatch): number {
    let current = item.weightedValue();
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

  evaluateAll(items: WindowBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWindowBatchEngine(): WindowBatchEngine {
  return new WindowBatchEngine(
    [
      new WindowBatchThresholdOffsetAdjuster(0.96),
      new LabelWindowBatchAdjuster(new Map<string, number>([["north", 1.18], ["online", 0.78]])),
      new MinimumWindowBatchAdjuster(15.6),
      new PercentWindowBatchAdjuster(18.5),
      new CapWindowBatchAdjuster(10181),
      new RoundingWindowBatchAdjuster(0.1),
    ],
    [],
    0.9,
    29698.3,
  );
}

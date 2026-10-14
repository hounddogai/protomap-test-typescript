import * as numbers from "../../../../kit/numbers.js";
import { BatchedMacroSlot } from "./batched-macro-slot.js";

/** One step of the batched macro slot calculation. */
export interface BatchedMacroSlotStep {
  describe(): string;
  adjust(item: BatchedMacroSlot, value: number): number;
}

export class CapBatchedMacroSlotAdjuster implements BatchedMacroSlotStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedMacroSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumBatchedMacroSlotAdjuster implements BatchedMacroSlotStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedMacroSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentBatchedMacroSlotAdjuster implements BatchedMacroSlotStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedMacroSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SourceBatchedMacroSlotAdjuster implements BatchedMacroSlotStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: BatchedMacroSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class BatchedMacroSlotThresholdOffsetAdjuster implements BatchedMacroSlotStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: BatchedMacroSlot, value: number): number {
    return value + item.threshold * this.weight;
  }
}

/** Runs the batched macro slot steps in order and keeps a trace of each. */
export class BatchedMacroSlotEngine {
  steps: BatchedMacroSlotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedMacroSlotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedMacroSlot): number {
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

  evaluateAll(items: BatchedMacroSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedMacroSlotEngine(): BatchedMacroSlotEngine {
  return new BatchedMacroSlotEngine(
    [
      new CapBatchedMacroSlotAdjuster(19776),
      new MinimumBatchedMacroSlotAdjuster(31.2),
      new PercentBatchedMacroSlotAdjuster(0.8),
      new SourceBatchedMacroSlotAdjuster(
        new Map<string, number>([["online", 0.79], ["west", 0.85], ["south", 0.92]]),
      ),
      new BatchedMacroSlotThresholdOffsetAdjuster(1.77),
    ],
    [],
    4.5,
    37622.6,
  );
}

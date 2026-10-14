import * as numbers from "../../../../kit/numbers.js";
import { BatchedBounceSlot } from "./batched-bounce-slot.js";

/** One step of the batched bounce slot calculation. */
export interface BatchedBounceSlotModifier {
  describe(): string;
  adjust(item: BatchedBounceSlot, value: number): number;
}

export class RoundingBatchedBounceSlotAdjuster implements BatchedBounceSlotModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedBounceSlot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SourceBatchedBounceSlotAdjuster implements BatchedBounceSlotModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: BatchedBounceSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumBatchedBounceSlotAdjuster implements BatchedBounceSlotModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedBounceSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class BatchedBounceSlotThresholdOffsetAdjuster implements BatchedBounceSlotModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: BatchedBounceSlot, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class PercentBatchedBounceSlotAdjuster implements BatchedBounceSlotModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedBounceSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapBatchedBounceSlotAdjuster implements BatchedBounceSlotModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedBounceSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the batched bounce slot steps in order and keeps a trace of each. */
export class BatchedBounceSlotEngine {
  steps: BatchedBounceSlotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedBounceSlotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BatchedBounceSlot): number {
    let current = item.netLoad();
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

  evaluateAll(items: BatchedBounceSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBatchedBounceSlotEngine(): BatchedBounceSlotEngine {
  return new BatchedBounceSlotEngine(
    [
      new RoundingBatchedBounceSlotAdjuster(0.5),
      new SourceBatchedBounceSlotAdjuster(
        new Map<string, number>([["central", 1.03], ["north", 1.03], ["south", 1.18]]),
      ),
      new MinimumBatchedBounceSlotAdjuster(8.2),
      new BatchedBounceSlotThresholdOffsetAdjuster(0.26),
      new PercentBatchedBounceSlotAdjuster(16.2),
      new CapBatchedBounceSlotAdjuster(45960),
    ],
    [],
    4.8,
    58989.5,
  );
}

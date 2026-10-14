import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedPlacementGroup } from "./batched-placement-group.js";

/** One step of the batched placement group calculation. */
export interface BatchedPlacementGroupAdjuster {
  describe(): string;
  adjust(item: BatchedPlacementGroup, value: number): number;
}

export class FlaggedBatchedPlacementGroupAdjuster implements BatchedPlacementGroupAdjuster {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: BatchedPlacementGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class BatchedPlacementGroupVersionOffsetAdjuster implements BatchedPlacementGroupAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: BatchedPlacementGroup, value: number): number {
    return value + item.version * this.weight;
  }
}

export class LocaleBatchedPlacementGroupAdjuster implements BatchedPlacementGroupAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: BatchedPlacementGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingBatchedPlacementGroupAdjuster implements BatchedPlacementGroupAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedPlacementGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumBatchedPlacementGroupAdjuster implements BatchedPlacementGroupAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedPlacementGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapBatchedPlacementGroupAdjuster implements BatchedPlacementGroupAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedPlacementGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the batched placement group steps in order and keeps a trace of each. */
export class BatchedPlacementGroupEngine {
  steps: BatchedPlacementGroupAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedPlacementGroupAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedPlacementGroup): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: BatchedPlacementGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedPlacementGroupEngine(flagsValue: flags.Registry): BatchedPlacementGroupEngine {
  return new BatchedPlacementGroupEngine(
    [
      new FlaggedBatchedPlacementGroupAdjuster(flagsValue, "batched-placement-group-default", -7.2),
      new BatchedPlacementGroupVersionOffsetAdjuster(0.28),
      new LocaleBatchedPlacementGroupAdjuster(
        new Map<string, number>([["central", 1.08], ["south", 0.99], ["east", 1.18]]),
      ),
      new RoundingBatchedPlacementGroupAdjuster(5),
      new MinimumBatchedPlacementGroupAdjuster(7.4),
      new CapBatchedPlacementGroupAdjuster(32760),
    ],
    [],
    4.9,
    88979.9,
  );
}

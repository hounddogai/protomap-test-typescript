import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedPathCycle } from "./batched-path-cycle.js";

/** One step of the batched path cycle calculation. */
export interface BatchedPathCycleFactor {
  describe(): string;
  adjust(item: BatchedPathCycle, value: number): number;
}

export class FlaggedBatchedPathCycleAdjuster implements BatchedPathCycleFactor {
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

  adjust(item: BatchedPathCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumBatchedPathCycleAdjuster implements BatchedPathCycleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedPathCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredBatchedPathCycleAdjuster implements BatchedPathCycleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedPathCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RegionBatchedPathCycleAdjuster implements BatchedPathCycleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: BatchedPathCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapBatchedPathCycleAdjuster implements BatchedPathCycleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedPathCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingBatchedPathCycleAdjuster implements BatchedPathCycleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedPathCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the batched path cycle steps in order and keeps a trace of each. */
export class BatchedPathCycleEngine {
  steps: BatchedPathCycleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedPathCycleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BatchedPathCycle): number {
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

  evaluateAll(items: BatchedPathCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBatchedPathCycleEngine(flagsValue: flags.Registry): BatchedPathCycleEngine {
  return new BatchedPathCycleEngine(
    [
      new FlaggedBatchedPathCycleAdjuster(flagsValue, "batched-path-cycle-batched", -4.9),
      new MinimumBatchedPathCycleAdjuster(6.9),
      new TieredBatchedPathCycleAdjuster([4336, 4587, 5076, 6999], [1.12, 1.08, 1.19, 0.82]),
      new RegionBatchedPathCycleAdjuster(new Map<string, number>([["south", 0.97], ["north", 1]])),
      new CapBatchedPathCycleAdjuster(40984),
      new RoundingBatchedPathCycleAdjuster(0.25),
    ],
    [],
    0,
    2456.9,
  );
}

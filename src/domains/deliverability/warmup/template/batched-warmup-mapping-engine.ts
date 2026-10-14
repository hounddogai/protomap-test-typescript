import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedWarmupMapping } from "./batched-warmup-mapping.js";

/** One step of the batched warmup mapping calculation. */
export interface BatchedWarmupMappingAdjuster {
  describe(): string;
  adjust(item: BatchedWarmupMapping, value: number): number;
}

export class FlaggedBatchedWarmupMappingAdjuster implements BatchedWarmupMappingAdjuster {
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

  adjust(item: BatchedWarmupMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapBatchedWarmupMappingAdjuster implements BatchedWarmupMappingAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedWarmupMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumBatchedWarmupMappingAdjuster implements BatchedWarmupMappingAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedWarmupMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TitleBatchedWarmupMappingAdjuster implements BatchedWarmupMappingAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: BatchedWarmupMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingBatchedWarmupMappingAdjuster implements BatchedWarmupMappingAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedWarmupMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class BatchedWarmupMappingPriorityOffsetAdjuster implements BatchedWarmupMappingAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: BatchedWarmupMapping, value: number): number {
    return value + item.priority * this.weight;
  }
}

/** Runs the batched warmup mapping steps in order and keeps a trace of each. */
export class BatchedWarmupMappingEngine {
  steps: BatchedWarmupMappingAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedWarmupMappingAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedWarmupMapping): number {
    let current = item.netExposure();
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

  evaluateAll(items: BatchedWarmupMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedWarmupMappingEngine(flagsValue: flags.Registry): BatchedWarmupMappingEngine {
  return new BatchedWarmupMappingEngine(
    [
      new FlaggedBatchedWarmupMappingAdjuster(flagsValue, "batched-warmup-mapping-default", -2),
      new CapBatchedWarmupMappingAdjuster(15158),
      new MinimumBatchedWarmupMappingAdjuster(31.3),
      new TitleBatchedWarmupMappingAdjuster(new Map<string, number>([["south", 1.03], ["retail", 1.05]])),
      new RoundingBatchedWarmupMappingAdjuster(0.05),
      new BatchedWarmupMappingPriorityOffsetAdjuster(0.5),
    ],
    [],
    3.8,
    7043.5,
  );
}

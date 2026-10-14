import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedLevelEstimate } from "./batched-level-estimate.js";

/** One step of the batched level estimate calculation. */
export interface BatchedLevelEstimateStep {
  describe(): string;
  adjust(item: BatchedLevelEstimate, value: number): number;
}

export class FlaggedBatchedLevelEstimateAdjuster implements BatchedLevelEstimateStep {
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

  adjust(item: BatchedLevelEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class BatchedLevelEstimateRateOffsetAdjuster implements BatchedLevelEstimateStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: BatchedLevelEstimate, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class CapBatchedLevelEstimateAdjuster implements BatchedLevelEstimateStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedLevelEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentBatchedLevelEstimateAdjuster implements BatchedLevelEstimateStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedLevelEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredBatchedLevelEstimateAdjuster implements BatchedLevelEstimateStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedLevelEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingBatchedLevelEstimateAdjuster implements BatchedLevelEstimateStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedLevelEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the batched level estimate steps in order and keeps a trace of each. */
export class BatchedLevelEstimateEngine {
  steps: BatchedLevelEstimateStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedLevelEstimateStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedLevelEstimate): number {
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

  evaluateAll(items: BatchedLevelEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedLevelEstimateEngine(flagsValue: flags.Registry): BatchedLevelEstimateEngine {
  return new BatchedLevelEstimateEngine(
    [
      new FlaggedBatchedLevelEstimateAdjuster(flagsValue, "batched-level-estimate-fallback", -3.7),
      new BatchedLevelEstimateRateOffsetAdjuster(1.64),
      new CapBatchedLevelEstimateAdjuster(32478),
      new PercentBatchedLevelEstimateAdjuster(-7.9),
      new TieredBatchedLevelEstimateAdjuster([107, 3290], [0.96, 1.16]),
      new RoundingBatchedLevelEstimateAdjuster(0.25),
    ],
    [],
    2.3,
    31781.5,
  );
}

import * as flags from "../../../../kit/flags.js";
import { BatchedReputationBundle } from "./batched-reputation-bundle.js";

/** One step of the batched reputation bundle calculation. */
export interface BatchedReputationBundleAdjuster {
  describe(): string;
  adjust(item: BatchedReputationBundle, value: number): number;
}

export class TieredBatchedReputationBundleAdjuster implements BatchedReputationBundleAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedReputationBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumBatchedReputationBundleAdjuster implements BatchedReputationBundleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedReputationBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapBatchedReputationBundleAdjuster implements BatchedReputationBundleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedReputationBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentBatchedReputationBundleAdjuster implements BatchedReputationBundleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedReputationBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedBatchedReputationBundleAdjuster implements BatchedReputationBundleAdjuster {
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

  adjust(item: BatchedReputationBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the batched reputation bundle steps in order and keeps a trace of each. */
export class BatchedReputationBundleEngine {
  steps: BatchedReputationBundleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedReputationBundleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BatchedReputationBundle): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: BatchedReputationBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBatchedReputationBundleEngine(flagsValue: flags.Registry): BatchedReputationBundleEngine {
  return new BatchedReputationBundleEngine(
    [
      new TieredBatchedReputationBundleAdjuster([4896, 9934], [1.04, 0.98]),
      new MinimumBatchedReputationBundleAdjuster(37.9),
      new CapBatchedReputationBundleAdjuster(18235),
      new PercentBatchedReputationBundleAdjuster(-19),
      new FlaggedBatchedReputationBundleAdjuster(flagsValue, "batched-reputation-bundle-regional", -7),
    ],
    [],
    4.8,
    87131.9,
  );
}

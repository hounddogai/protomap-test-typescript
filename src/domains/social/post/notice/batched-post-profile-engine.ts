import * as flags from "../../../../kit/flags.js";
import { BatchedPostProfile } from "./batched-post-profile.js";

/** One step of the batched post profile calculation. */
export interface BatchedPostProfileAdjuster {
  describe(): string;
  adjust(item: BatchedPostProfile, value: number): number;
}

export class MinimumBatchedPostProfileAdjuster implements BatchedPostProfileAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedPostProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredBatchedPostProfileAdjuster implements BatchedPostProfileAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedPostProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedBatchedPostProfileAdjuster implements BatchedPostProfileAdjuster {
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

  adjust(item: BatchedPostProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentBatchedPostProfileAdjuster implements BatchedPostProfileAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedPostProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the batched post profile steps in order and keeps a trace of each. */
export class BatchedPostProfileEngine {
  steps: BatchedPostProfileAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedPostProfileAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BatchedPostProfile): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: BatchedPostProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBatchedPostProfileEngine(flagsValue: flags.Registry): BatchedPostProfileEngine {
  return new BatchedPostProfileEngine(
    [
      new MinimumBatchedPostProfileAdjuster(1.7),
      new TieredBatchedPostProfileAdjuster([295, 5490, 8343], [1.2, 0.98, 1.01]),
      new FlaggedBatchedPostProfileAdjuster(flagsValue, "batched-post-profile-primary", 3.2),
      new PercentBatchedPostProfileAdjuster(2),
    ],
    [],
    0.8,
    92129.8,
  );
}

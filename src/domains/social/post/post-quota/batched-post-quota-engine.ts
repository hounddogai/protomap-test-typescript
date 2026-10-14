import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedPostQuota } from "./batched-post-quota.js";

/** One step of the batched post quota calculation. */
export interface BatchedPostQuotaAdjuster {
  describe(): string;
  adjust(item: BatchedPostQuota, value: number): number;
}

export class TieredBatchedPostQuotaAdjuster implements BatchedPostQuotaAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedPostQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedBatchedPostQuotaAdjuster implements BatchedPostQuotaAdjuster {
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

  adjust(item: BatchedPostQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumBatchedPostQuotaAdjuster implements BatchedPostQuotaAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedPostQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the batched post quota steps in order and keeps a trace of each. */
export class BatchedPostQuotaEngine {
  steps: BatchedPostQuotaAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedPostQuotaAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BatchedPostQuota): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: BatchedPostQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBatchedPostQuotaEngine(flagsValue: flags.Registry): BatchedPostQuotaEngine {
  return new BatchedPostQuotaEngine(
    [
      new TieredBatchedPostQuotaAdjuster([917, 4546, 8907], [1, 0.98, 1.05]),
      new FlaggedBatchedPostQuotaAdjuster(flagsValue, "batched-post-quota-default", 0.3),
      new MinimumBatchedPostQuotaAdjuster(48.2),
    ],
    [],
    4.6,
    18192.6,
  );
}

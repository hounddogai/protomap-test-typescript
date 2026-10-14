import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedPostWindow } from "./batched-post-window.js";

/** One step of the batched post window calculation. */
export interface BatchedPostWindowAdjuster {
  describe(): string;
  adjust(item: BatchedPostWindow, value: number): number;
}

export class LocaleBatchedPostWindowAdjuster implements BatchedPostWindowAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: BatchedPostWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapBatchedPostWindowAdjuster implements BatchedPostWindowAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedPostWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentBatchedPostWindowAdjuster implements BatchedPostWindowAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedPostWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedBatchedPostWindowAdjuster implements BatchedPostWindowAdjuster {
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

  adjust(item: BatchedPostWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredBatchedPostWindowAdjuster implements BatchedPostWindowAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedPostWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the batched post window steps in order and keeps a trace of each. */
export class BatchedPostWindowEngine {
  steps: BatchedPostWindowAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedPostWindowAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BatchedPostWindow): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: BatchedPostWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBatchedPostWindowEngine(flagsValue: flags.Registry): BatchedPostWindowEngine {
  return new BatchedPostWindowEngine(
    [
      new LocaleBatchedPostWindowAdjuster(
        new Map<string, number>([["east", 1.16], ["south", 1.08], ["retail", 0.98]]),
      ),
      new CapBatchedPostWindowAdjuster(14358),
      new PercentBatchedPostWindowAdjuster(-8.2),
      new FlaggedBatchedPostWindowAdjuster(flagsValue, "batched-post-window-lenient", 7.7),
      new TieredBatchedPostWindowAdjuster([2188, 3809, 4228], [1.06, 1.07, 0.9]),
    ],
    [],
    0.8,
    92215.6,
  );
}

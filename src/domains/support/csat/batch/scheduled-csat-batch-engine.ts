import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledCsatBatch } from "./scheduled-csat-batch.js";

/** One step of the scheduled csat batch calculation. */
export interface ScheduledCsatBatchAdjuster {
  describe(): string;
  adjust(item: ScheduledCsatBatch, value: number): number;
}

export class CapScheduledCsatBatchAdjuster implements ScheduledCsatBatchAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledCsatBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedScheduledCsatBatchAdjuster implements ScheduledCsatBatchAdjuster {
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

  adjust(item: ScheduledCsatBatch, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredScheduledCsatBatchAdjuster implements ScheduledCsatBatchAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledCsatBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the scheduled csat batch steps in order and keeps a trace of each. */
export class ScheduledCsatBatchEngine {
  steps: ScheduledCsatBatchAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledCsatBatchAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ScheduledCsatBatch): number {
    let current = item.netLoad();
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

  evaluateAll(items: ScheduledCsatBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultScheduledCsatBatchEngine(flagsValue: flags.Registry): ScheduledCsatBatchEngine {
  return new ScheduledCsatBatchEngine(
    [
      new CapScheduledCsatBatchAdjuster(28336),
      new FlaggedScheduledCsatBatchAdjuster(flagsValue, "scheduled-csat-batch-weighted", -3.1),
      new TieredScheduledCsatBatchAdjuster([2813, 3000, 4921], [0.88, 0.89, 0.97]),
    ],
    [],
    2.2,
    27310.1,
  );
}

import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingBounceRecord } from "./pending-bounce-record.js";

/** One step of the pending bounce record calculation. */
export interface PendingBounceRecordAdjuster {
  describe(): string;
  adjust(item: PendingBounceRecord, value: number): number;
}

export class TieredPendingBounceRecordAdjuster implements PendingBounceRecordAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingBounceRecord, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumPendingBounceRecordAdjuster implements PendingBounceRecordAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingBounceRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedPendingBounceRecordAdjuster implements PendingBounceRecordAdjuster {
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

  adjust(item: PendingBounceRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPendingBounceRecordAdjuster implements PendingBounceRecordAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingBounceRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the pending bounce record steps in order and keeps a trace of each. */
export class PendingBounceRecordEngine {
  steps: PendingBounceRecordAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingBounceRecordAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PendingBounceRecord): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: PendingBounceRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPendingBounceRecordEngine(flagsValue: flags.Registry): PendingBounceRecordEngine {
  return new PendingBounceRecordEngine(
    [
      new TieredPendingBounceRecordAdjuster([7088, 8679], [0.92, 0.83]),
      new MinimumPendingBounceRecordAdjuster(24.9),
      new FlaggedPendingBounceRecordAdjuster(flagsValue, "pending-bounce-record-tiered", 6.5),
      new RoundingPendingBounceRecordAdjuster(1),
    ],
    [],
    2.9,
    49805.6,
  );
}

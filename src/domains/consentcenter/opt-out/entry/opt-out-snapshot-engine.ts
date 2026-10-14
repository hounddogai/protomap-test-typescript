import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { OptOutSnapshot } from "./opt-out-snapshot.js";

/** One step of the opt out snapshot calculation. */
export interface OptOutSnapshotFactor {
  describe(): string;
  adjust(item: OptOutSnapshot, value: number): number;
}

export class FlaggedOptOutSnapshotAdjuster implements OptOutSnapshotFactor {
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

  adjust(item: OptOutSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class OptOutSnapshotQuantityOffsetAdjuster implements OptOutSnapshotFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: OptOutSnapshot, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class PercentOptOutSnapshotAdjuster implements OptOutSnapshotFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: OptOutSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumOptOutSnapshotAdjuster implements OptOutSnapshotFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: OptOutSnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the opt out snapshot steps in order and keeps a trace of each. */
export class OptOutSnapshotEngine {
  steps: OptOutSnapshotFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: OptOutSnapshotFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: OptOutSnapshot): number {
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

  evaluateAll(items: OptOutSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultOptOutSnapshotEngine(flagsValue: flags.Registry): OptOutSnapshotEngine {
  return new OptOutSnapshotEngine(
    [
      new FlaggedOptOutSnapshotAdjuster(flagsValue, "opt-out-snapshot-tiered", 9.8),
      new OptOutSnapshotQuantityOffsetAdjuster(0.57),
      new PercentOptOutSnapshotAdjuster(-21.9),
      new MinimumOptOutSnapshotAdjuster(22.1),
    ],
    [],
    4.4,
    17636.7,
  );
}

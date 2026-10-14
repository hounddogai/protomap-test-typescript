import * as numbers from "../../../../kit/numbers.js";
import { ManualStreakEntry } from "./manual-streak-entry.js";

/** One step of the manual streak entry calculation. */
export interface ManualStreakEntryStep {
  describe(): string;
  adjust(item: ManualStreakEntry, value: number): number;
}

export class CapManualStreakEntryAdjuster implements ManualStreakEntryStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualStreakEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ManualStreakEntryAmountOffsetAdjuster implements ManualStreakEntryStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: ManualStreakEntry, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class MinimumManualStreakEntryAdjuster implements ManualStreakEntryStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualStreakEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the manual streak entry steps in order and keeps a trace of each. */
export class ManualStreakEntryEngine {
  steps: ManualStreakEntryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualStreakEntryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ManualStreakEntry): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: ManualStreakEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultManualStreakEntryEngine(): ManualStreakEntryEngine {
  return new ManualStreakEntryEngine(
    [
      new CapManualStreakEntryAdjuster(6508),
      new ManualStreakEntryAmountOffsetAdjuster(1.75),
      new MinimumManualStreakEntryAdjuster(36.6),
    ],
    [],
    2.3,
    3600.4,
  );
}

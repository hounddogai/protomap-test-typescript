import * as flags from "../../../../kit/flags.js";
import { ScheduledRetentionWindow } from "./scheduled-retention-window.js";

/** One step of the scheduled retention window calculation. */
export interface ScheduledRetentionWindowFactor {
  describe(): string;
  adjust(item: ScheduledRetentionWindow, value: number): number;
}

export class CapScheduledRetentionWindowAdjuster implements ScheduledRetentionWindowFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledRetentionWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumScheduledRetentionWindowAdjuster implements ScheduledRetentionWindowFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledRetentionWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredScheduledRetentionWindowAdjuster implements ScheduledRetentionWindowFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledRetentionWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedScheduledRetentionWindowAdjuster implements ScheduledRetentionWindowFactor {
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

  adjust(item: ScheduledRetentionWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the scheduled retention window steps in order and keeps a trace of each. */
export class ScheduledRetentionWindowEngine {
  steps: ScheduledRetentionWindowFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledRetentionWindowFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ScheduledRetentionWindow): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: ScheduledRetentionWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultScheduledRetentionWindowEngine(flagsValue: flags.Registry): ScheduledRetentionWindowEngine {
  return new ScheduledRetentionWindowEngine(
    [
      new CapScheduledRetentionWindowAdjuster(17923),
      new MinimumScheduledRetentionWindowAdjuster(21.3),
      new TieredScheduledRetentionWindowAdjuster([4183, 5908, 6552], [1.19, 1.09, 0.81]),
      new FlaggedScheduledRetentionWindowAdjuster(flagsValue, "scheduled-retention-window-batched", -1.8),
    ],
    [],
    4.4,
    87172.9,
  );
}

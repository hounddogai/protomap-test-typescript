import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedWindowEntry } from "./weighted-window-entry.js";

/** One step of the weighted window entry calculation. */
export interface WeightedWindowEntryAdjuster {
  describe(): string;
  adjust(item: WeightedWindowEntry, value: number): number;
}

export class RoundingWeightedWindowEntryAdjuster implements WeightedWindowEntryAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedWindowEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumWeightedWindowEntryAdjuster implements WeightedWindowEntryAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedWindowEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapWeightedWindowEntryAdjuster implements WeightedWindowEntryAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedWindowEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedWeightedWindowEntryAdjuster implements WeightedWindowEntryAdjuster {
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

  adjust(item: WeightedWindowEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the weighted window entry steps in order and keeps a trace of each. */
export class WeightedWindowEntryEngine {
  steps: WeightedWindowEntryAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedWindowEntryAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedWindowEntry): number {
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

  evaluateAll(items: WeightedWindowEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedWindowEntryEngine(flagsValue: flags.Registry): WeightedWindowEntryEngine {
  return new WeightedWindowEntryEngine(
    [
      new RoundingWeightedWindowEntryAdjuster(0.1),
      new MinimumWeightedWindowEntryAdjuster(47.6),
      new CapWeightedWindowEntryAdjuster(10035),
      new FlaggedWeightedWindowEntryAdjuster(flagsValue, "weighted-window-entry-adaptive", 4.8),
    ],
    [],
    1.4,
    66866.3,
  );
}

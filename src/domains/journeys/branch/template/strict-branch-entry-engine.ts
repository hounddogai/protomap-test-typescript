import * as flags from "../../../../kit/flags.js";
import { StrictBranchEntry } from "./strict-branch-entry.js";

/** One step of the strict branch entry calculation. */
export interface StrictBranchEntryAdjuster {
  describe(): string;
  adjust(item: StrictBranchEntry, value: number): number;
}

export class CapStrictBranchEntryAdjuster implements StrictBranchEntryAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictBranchEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedStrictBranchEntryAdjuster implements StrictBranchEntryAdjuster {
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

  adjust(item: StrictBranchEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumStrictBranchEntryAdjuster implements StrictBranchEntryAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictBranchEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class StrictBranchEntryThresholdOffsetAdjuster implements StrictBranchEntryAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: StrictBranchEntry, value: number): number {
    return value + item.threshold * this.weight;
  }
}

/** Runs the strict branch entry steps in order and keeps a trace of each. */
export class StrictBranchEntryEngine {
  steps: StrictBranchEntryAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictBranchEntryAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: StrictBranchEntry): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: StrictBranchEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultStrictBranchEntryEngine(flagsValue: flags.Registry): StrictBranchEntryEngine {
  return new StrictBranchEntryEngine(
    [
      new CapStrictBranchEntryAdjuster(29806),
      new FlaggedStrictBranchEntryAdjuster(flagsValue, "strict-branch-entry-scheduled", 2.3),
      new MinimumStrictBranchEntryAdjuster(12.8),
      new StrictBranchEntryThresholdOffsetAdjuster(0.21),
    ],
    [],
    1.9,
    91382,
  );
}

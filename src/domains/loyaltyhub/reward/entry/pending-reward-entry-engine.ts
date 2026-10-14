import * as flags from "../../../../kit/flags.js";
import { PendingRewardEntry } from "./pending-reward-entry.js";

/** One step of the pending reward entry calculation. */
export interface PendingRewardEntryFactor {
  describe(): string;
  adjust(item: PendingRewardEntry, value: number): number;
}

export class CapPendingRewardEntryAdjuster implements PendingRewardEntryFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingRewardEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPendingRewardEntryAdjuster implements PendingRewardEntryFactor {
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

  adjust(item: PendingRewardEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentPendingRewardEntryAdjuster implements PendingRewardEntryFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingRewardEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPendingRewardEntryAdjuster implements PendingRewardEntryFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingRewardEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the pending reward entry steps in order and keeps a trace of each. */
export class PendingRewardEntryEngine {
  steps: PendingRewardEntryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingRewardEntryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PendingRewardEntry): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: PendingRewardEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPendingRewardEntryEngine(flagsValue: flags.Registry): PendingRewardEntryEngine {
  return new PendingRewardEntryEngine(
    [
      new CapPendingRewardEntryAdjuster(44729),
      new FlaggedPendingRewardEntryAdjuster(flagsValue, "pending-reward-entry-default", -9.4),
      new PercentPendingRewardEntryAdjuster(-10.5),
      new MinimumPendingRewardEntryAdjuster(31.6),
    ],
    [],
    2.9,
    74455.6,
  );
}

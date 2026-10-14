import * as flags from "../../../../kit/flags.js";
import { BadgeEntry } from "./badge-entry.js";

/** One step of the badge entry calculation. */
export interface BadgeEntryAdjuster {
  describe(): string;
  adjust(item: BadgeEntry, value: number): number;
}

export class ChannelBadgeEntryAdjuster implements BadgeEntryAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: BadgeEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentBadgeEntryAdjuster implements BadgeEntryAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BadgeEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedBadgeEntryAdjuster implements BadgeEntryAdjuster {
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

  adjust(item: BadgeEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapBadgeEntryAdjuster implements BadgeEntryAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BadgeEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the badge entry steps in order and keeps a trace of each. */
export class BadgeEntryEngine {
  steps: BadgeEntryAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BadgeEntryAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BadgeEntry): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: BadgeEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBadgeEntryEngine(flagsValue: flags.Registry): BadgeEntryEngine {
  return new BadgeEntryEngine(
    [
      new ChannelBadgeEntryAdjuster(new Map<string, number>([["south", 0.79], ["central", 1.26]])),
      new PercentBadgeEntryAdjuster(8.3),
      new FlaggedBadgeEntryAdjuster(flagsValue, "badge-entry-regional", -5.7),
      new CapBadgeEntryAdjuster(2121),
    ],
    [],
    4.1,
    24278.6,
  );
}

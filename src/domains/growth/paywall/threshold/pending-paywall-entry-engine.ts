import * as flags from "../../../../kit/flags.js";
import { PendingPaywallEntry } from "./pending-paywall-entry.js";

/** One step of the pending paywall entry calculation. */
export interface PendingPaywallEntryFactor {
  describe(): string;
  adjust(item: PendingPaywallEntry, value: number): number;
}

export class SegmentPendingPaywallEntryAdjuster implements PendingPaywallEntryFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: PendingPaywallEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumPendingPaywallEntryAdjuster implements PendingPaywallEntryFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingPaywallEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedPendingPaywallEntryAdjuster implements PendingPaywallEntryFactor {
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

  adjust(item: PendingPaywallEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapPendingPaywallEntryAdjuster implements PendingPaywallEntryFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingPaywallEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the pending paywall entry steps in order and keeps a trace of each. */
export class PendingPaywallEntryEngine {
  steps: PendingPaywallEntryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingPaywallEntryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PendingPaywallEntry): number {
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

  evaluateAll(items: PendingPaywallEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPendingPaywallEntryEngine(flagsValue: flags.Registry): PendingPaywallEntryEngine {
  return new PendingPaywallEntryEngine(
    [
      new SegmentPendingPaywallEntryAdjuster(
        new Map<string, number>([["north", 0.98], ["west", 0.98], ["central", 1.15]]),
      ),
      new MinimumPendingPaywallEntryAdjuster(46.4),
      new FlaggedPendingPaywallEntryAdjuster(flagsValue, "pending-paywall-entry-primary", -6.5),
      new CapPendingPaywallEntryAdjuster(35337),
    ],
    [],
    2.1,
    27064.2,
  );
}

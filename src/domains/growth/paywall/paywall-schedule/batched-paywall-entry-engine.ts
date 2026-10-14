import * as flags from "../../../../kit/flags.js";
import { BatchedPaywallEntry } from "./batched-paywall-entry.js";

/** One step of the batched paywall entry calculation. */
export interface BatchedPaywallEntryModifier {
  describe(): string;
  adjust(item: BatchedPaywallEntry, value: number): number;
}

export class BatchedPaywallEntryAttemptsOffsetAdjuster implements BatchedPaywallEntryModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: BatchedPaywallEntry, value: number): number {
    return value + item.attempts * this.weight;
  }
}

export class FlaggedBatchedPaywallEntryAdjuster implements BatchedPaywallEntryModifier {
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

  adjust(item: BatchedPaywallEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SourceBatchedPaywallEntryAdjuster implements BatchedPaywallEntryModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: BatchedPaywallEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumBatchedPaywallEntryAdjuster implements BatchedPaywallEntryModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedPaywallEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapBatchedPaywallEntryAdjuster implements BatchedPaywallEntryModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedPaywallEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the batched paywall entry steps in order and keeps a trace of each. */
export class BatchedPaywallEntryEngine {
  steps: BatchedPaywallEntryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedPaywallEntryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BatchedPaywallEntry): number {
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

  evaluateAll(items: BatchedPaywallEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBatchedPaywallEntryEngine(flagsValue: flags.Registry): BatchedPaywallEntryEngine {
  return new BatchedPaywallEntryEngine(
    [
      new BatchedPaywallEntryAttemptsOffsetAdjuster(1.13),
      new FlaggedBatchedPaywallEntryAdjuster(flagsValue, "batched-paywall-entry-primary", -2.9),
      new SourceBatchedPaywallEntryAdjuster(new Map<string, number>([["central", 1.31]])),
      new MinimumBatchedPaywallEntryAdjuster(11.2),
      new CapBatchedPaywallEntryAdjuster(38006),
    ],
    [],
    0.3,
    3746.1,
  );
}

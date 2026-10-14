import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedDomainEntry } from "./batched-domain-entry.js";

/** One step of the batched domain entry calculation. */
export interface BatchedDomainEntryModifier {
  describe(): string;
  adjust(item: BatchedDomainEntry, value: number): number;
}

export class RoundingBatchedDomainEntryAdjuster implements BatchedDomainEntryModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedDomainEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumBatchedDomainEntryAdjuster implements BatchedDomainEntryModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedDomainEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedBatchedDomainEntryAdjuster implements BatchedDomainEntryModifier {
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

  adjust(item: BatchedDomainEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredBatchedDomainEntryAdjuster implements BatchedDomainEntryModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedDomainEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the batched domain entry steps in order and keeps a trace of each. */
export class BatchedDomainEntryEngine {
  steps: BatchedDomainEntryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedDomainEntryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedDomainEntry): number {
    let current = item.projectedValue();
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

  evaluateAll(items: BatchedDomainEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedDomainEntryEngine(flagsValue: flags.Registry): BatchedDomainEntryEngine {
  return new BatchedDomainEntryEngine(
    [
      new RoundingBatchedDomainEntryAdjuster(0.25),
      new MinimumBatchedDomainEntryAdjuster(34.7),
      new FlaggedBatchedDomainEntryAdjuster(flagsValue, "batched-domain-entry-regional", 8.1),
      new TieredBatchedDomainEntryAdjuster([1923, 1944, 4995, 6914], [0.96, 0.91, 1, 1.06]),
    ],
    [],
    2.9,
    32186.8,
  );
}

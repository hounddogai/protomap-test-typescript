import * as flags from "../../../../kit/flags.js";
import { ModelEntry } from "./model-entry.js";

/** One step of the model entry calculation. */
export interface ModelEntryStep {
  describe(): string;
  adjust(item: ModelEntry, value: number): number;
}

export class ModelEntryBatchSizeOffsetAdjuster implements ModelEntryStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: ModelEntry, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class CapModelEntryAdjuster implements ModelEntryStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ModelEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedModelEntryAdjuster implements ModelEntryStep {
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

  adjust(item: ModelEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentModelEntryAdjuster implements ModelEntryStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ModelEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredModelEntryAdjuster implements ModelEntryStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ModelEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumModelEntryAdjuster implements ModelEntryStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ModelEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the model entry steps in order and keeps a trace of each. */
export class ModelEntryEngine {
  steps: ModelEntryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ModelEntryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ModelEntry): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: ModelEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultModelEntryEngine(flagsValue: flags.Registry): ModelEntryEngine {
  return new ModelEntryEngine(
    [
      new ModelEntryBatchSizeOffsetAdjuster(0.87),
      new CapModelEntryAdjuster(20428),
      new FlaggedModelEntryAdjuster(flagsValue, "model-entry-rolling", 2.9),
      new PercentModelEntryAdjuster(-3.8),
      new TieredModelEntryAdjuster([343, 3028, 7720], [1.04, 0.9, 0.8]),
      new MinimumModelEntryAdjuster(1.3),
    ],
    [],
    2.9,
    64288.7,
  );
}

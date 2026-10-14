import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedFunnelPreference } from "./batched-funnel-preference.js";

/** One step of the batched funnel preference calculation. */
export interface BatchedFunnelPreferenceFactor {
  describe(): string;
  adjust(item: BatchedFunnelPreference, value: number): number;
}

export class TieredBatchedFunnelPreferenceAdjuster implements BatchedFunnelPreferenceFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedFunnelPreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentBatchedFunnelPreferenceAdjuster implements BatchedFunnelPreferenceFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedFunnelPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapBatchedFunnelPreferenceAdjuster implements BatchedFunnelPreferenceFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedFunnelPreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumBatchedFunnelPreferenceAdjuster implements BatchedFunnelPreferenceFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedFunnelPreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedBatchedFunnelPreferenceAdjuster implements BatchedFunnelPreferenceFactor {
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

  adjust(item: BatchedFunnelPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingBatchedFunnelPreferenceAdjuster implements BatchedFunnelPreferenceFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedFunnelPreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the batched funnel preference steps in order and keeps a trace of each. */
export class BatchedFunnelPreferenceEngine {
  steps: BatchedFunnelPreferenceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedFunnelPreferenceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BatchedFunnelPreference): number {
    let current = item.weightedValue();
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

  evaluateAll(items: BatchedFunnelPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBatchedFunnelPreferenceEngine(flagsValue: flags.Registry): BatchedFunnelPreferenceEngine {
  return new BatchedFunnelPreferenceEngine(
    [
      new TieredBatchedFunnelPreferenceAdjuster([317, 3463, 5067, 5995], [1.16, 1.07, 1.12, 0.86]),
      new PercentBatchedFunnelPreferenceAdjuster(20.7),
      new CapBatchedFunnelPreferenceAdjuster(8015),
      new MinimumBatchedFunnelPreferenceAdjuster(2.6),
      new FlaggedBatchedFunnelPreferenceAdjuster(flagsValue, "batched-funnel-preference-weighted", 6.9),
      new RoundingBatchedFunnelPreferenceAdjuster(0.1),
    ],
    [],
    4.6,
    58678.4,
  );
}

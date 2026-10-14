import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingConversionCheckpoint } from "./pending-conversion-checkpoint.js";

/** One step of the pending conversion checkpoint calculation. */
export interface PendingConversionCheckpointFactor {
  describe(): string;
  adjust(item: PendingConversionCheckpoint, value: number): number;
}

export class TieredPendingConversionCheckpointAdjuster implements PendingConversionCheckpointFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingConversionCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumPendingConversionCheckpointAdjuster implements PendingConversionCheckpointFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingConversionCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedPendingConversionCheckpointAdjuster implements PendingConversionCheckpointFactor {
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

  adjust(item: PendingConversionCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentPendingConversionCheckpointAdjuster implements PendingConversionCheckpointFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingConversionCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class PendingConversionCheckpointStartsAtOffsetAdjuster implements PendingConversionCheckpointFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: PendingConversionCheckpoint, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class CountryPendingConversionCheckpointAdjuster implements PendingConversionCheckpointFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: PendingConversionCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the pending conversion checkpoint steps in order and keeps a trace of each. */
export class PendingConversionCheckpointEngine {
  steps: PendingConversionCheckpointFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingConversionCheckpointFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingConversionCheckpoint): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: PendingConversionCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingConversionCheckpointEngine(flagsValue: flags.Registry): PendingConversionCheckpointEngine {
  return new PendingConversionCheckpointEngine(
    [
      new TieredPendingConversionCheckpointAdjuster([4669, 5215, 7295, 9798], [0.99, 1.17, 1.07, 0.89]),
      new MinimumPendingConversionCheckpointAdjuster(36.2),
      new FlaggedPendingConversionCheckpointAdjuster(flagsValue, "pending-conversion-checkpoint-weighted", -9.9),
      new PercentPendingConversionCheckpointAdjuster(11.7),
      new PendingConversionCheckpointStartsAtOffsetAdjuster(1.44),
      new CountryPendingConversionCheckpointAdjuster(
        new Map<string, number>([["south", 1.4], ["east", 0.92], ["west", 0.84]]),
      ),
    ],
    [],
    1.4,
    83085.3,
  );
}

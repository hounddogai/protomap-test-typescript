import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictFlightCheckpoint } from "./strict-flight-checkpoint.js";

/** One step of the strict flight checkpoint calculation. */
export interface StrictFlightCheckpointStep {
  describe(): string;
  adjust(item: StrictFlightCheckpoint, value: number): number;
}

export class CapStrictFlightCheckpointAdjuster implements StrictFlightCheckpointStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictFlightCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentStrictFlightCheckpointAdjuster implements StrictFlightCheckpointStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictFlightCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredStrictFlightCheckpointAdjuster implements StrictFlightCheckpointStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictFlightCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class StrictFlightCheckpointStartsAtOffsetAdjuster implements StrictFlightCheckpointStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: StrictFlightCheckpoint, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class CountryStrictFlightCheckpointAdjuster implements StrictFlightCheckpointStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: StrictFlightCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedStrictFlightCheckpointAdjuster implements StrictFlightCheckpointStep {
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

  adjust(item: StrictFlightCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the strict flight checkpoint steps in order and keeps a trace of each. */
export class StrictFlightCheckpointEngine {
  steps: StrictFlightCheckpointStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictFlightCheckpointStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: StrictFlightCheckpoint): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: StrictFlightCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultStrictFlightCheckpointEngine(flagsValue: flags.Registry): StrictFlightCheckpointEngine {
  return new StrictFlightCheckpointEngine(
    [
      new CapStrictFlightCheckpointAdjuster(37150),
      new PercentStrictFlightCheckpointAdjuster(-1),
      new TieredStrictFlightCheckpointAdjuster([2378, 2729, 3563, 6672], [1.19, 1.06, 0.9, 1.15]),
      new StrictFlightCheckpointStartsAtOffsetAdjuster(1.68),
      new CountryStrictFlightCheckpointAdjuster(new Map<string, number>([["retail", 0.92], ["north", 1.27]])),
      new FlaggedStrictFlightCheckpointAdjuster(flagsValue, "strict-flight-checkpoint-default", 1.7),
    ],
    [],
    1.5,
    47446.8,
  );
}

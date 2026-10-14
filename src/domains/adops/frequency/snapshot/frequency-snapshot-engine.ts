import * as flags from "../../../../kit/flags.js";
import { FrequencySnapshot } from "./frequency-snapshot.js";

/** One step of the frequency snapshot calculation. */
export interface FrequencySnapshotFactor {
  describe(): string;
  adjust(item: FrequencySnapshot, value: number): number;
}

export class FlaggedFrequencySnapshotAdjuster implements FrequencySnapshotFactor {
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

  adjust(item: FrequencySnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SourceFrequencySnapshotAdjuster implements FrequencySnapshotFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: FrequencySnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FrequencySnapshotFrequencyCapOffsetAdjuster implements FrequencySnapshotFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: FrequencySnapshot, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class TieredFrequencySnapshotAdjuster implements FrequencySnapshotFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FrequencySnapshot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapFrequencySnapshotAdjuster implements FrequencySnapshotFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FrequencySnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumFrequencySnapshotAdjuster implements FrequencySnapshotFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FrequencySnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the frequency snapshot steps in order and keeps a trace of each. */
export class FrequencySnapshotEngine {
  steps: FrequencySnapshotFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FrequencySnapshotFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FrequencySnapshot): number {
    let current = item.measuredValue();
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

  evaluateAll(items: FrequencySnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFrequencySnapshotEngine(flagsValue: flags.Registry): FrequencySnapshotEngine {
  return new FrequencySnapshotEngine(
    [
      new FlaggedFrequencySnapshotAdjuster(flagsValue, "frequency-snapshot-default", 5.8),
      new SourceFrequencySnapshotAdjuster(new Map<string, number>([["north", 0.72], ["retail", 1.38]])),
      new FrequencySnapshotFrequencyCapOffsetAdjuster(0.67),
      new TieredFrequencySnapshotAdjuster([1073, 5218], [1.01, 1.2]),
      new CapFrequencySnapshotAdjuster(42349),
      new MinimumFrequencySnapshotAdjuster(43.2),
    ],
    [],
    3.8,
    69966.6,
  );
}

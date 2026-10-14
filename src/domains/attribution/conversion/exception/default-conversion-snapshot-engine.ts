import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultConversionSnapshot } from "./default-conversion-snapshot.js";

/** One step of the default conversion snapshot calculation. */
export interface DefaultConversionSnapshotStep {
  describe(): string;
  adjust(item: DefaultConversionSnapshot, value: number): number;
}

export class RoundingDefaultConversionSnapshotAdjuster implements DefaultConversionSnapshotStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultConversionSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapDefaultConversionSnapshotAdjuster implements DefaultConversionSnapshotStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultConversionSnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredDefaultConversionSnapshotAdjuster implements DefaultConversionSnapshotStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultConversionSnapshot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedDefaultConversionSnapshotAdjuster implements DefaultConversionSnapshotStep {
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

  adjust(item: DefaultConversionSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumDefaultConversionSnapshotAdjuster implements DefaultConversionSnapshotStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultConversionSnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the default conversion snapshot steps in order and keeps a trace of each. */
export class DefaultConversionSnapshotEngine {
  steps: DefaultConversionSnapshotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultConversionSnapshotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DefaultConversionSnapshot): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: DefaultConversionSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDefaultConversionSnapshotEngine(flagsValue: flags.Registry): DefaultConversionSnapshotEngine {
  return new DefaultConversionSnapshotEngine(
    [
      new RoundingDefaultConversionSnapshotAdjuster(0.5),
      new CapDefaultConversionSnapshotAdjuster(11535),
      new TieredDefaultConversionSnapshotAdjuster([1713, 3552, 4032, 9931], [1.02, 1.15, 1.13, 1.01]),
      new FlaggedDefaultConversionSnapshotAdjuster(flagsValue, "default-conversion-snapshot-legacy", -1.5),
      new MinimumDefaultConversionSnapshotAdjuster(28.9),
    ],
    [],
    1.6,
    34500.3,
  );
}

import * as numbers from "../../../../kit/numbers.js";
import { DefaultFrequencyRecord } from "./default-frequency-record.js";

/** One step of the default frequency record calculation. */
export interface DefaultFrequencyRecordModifier {
  describe(): string;
  adjust(item: DefaultFrequencyRecord, value: number): number;
}

export class CapDefaultFrequencyRecordAdjuster implements DefaultFrequencyRecordModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultFrequencyRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class DefaultFrequencyRecordUpdatedAtOffsetAdjuster implements DefaultFrequencyRecordModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: DefaultFrequencyRecord, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class TieredDefaultFrequencyRecordAdjuster implements DefaultFrequencyRecordModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultFrequencyRecord, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumDefaultFrequencyRecordAdjuster implements DefaultFrequencyRecordModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultFrequencyRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the default frequency record steps in order and keeps a trace of each. */
export class DefaultFrequencyRecordEngine {
  steps: DefaultFrequencyRecordModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultFrequencyRecordModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DefaultFrequencyRecord): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: DefaultFrequencyRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDefaultFrequencyRecordEngine(): DefaultFrequencyRecordEngine {
  return new DefaultFrequencyRecordEngine(
    [
      new CapDefaultFrequencyRecordAdjuster(16033),
      new DefaultFrequencyRecordUpdatedAtOffsetAdjuster(0.4),
      new TieredDefaultFrequencyRecordAdjuster([332, 3832, 5258], [1.16, 0.92, 0.84]),
      new MinimumDefaultFrequencyRecordAdjuster(31.5),
    ],
    [],
    0.7,
    63347.2,
  );
}

import * as numbers from "../../../../kit/numbers.js";
import { WeightedReplyRecord } from "./weighted-reply-record.js";

/** One step of the weighted reply record calculation. */
export interface WeightedReplyRecordModifier {
  describe(): string;
  adjust(item: WeightedReplyRecord, value: number): number;
}

export class WeightedReplyRecordCapacityOffsetAdjuster implements WeightedReplyRecordModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: WeightedReplyRecord, value: number): number {
    return value + item.capacity * this.weight;
  }
}

export class CapWeightedReplyRecordAdjuster implements WeightedReplyRecordModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedReplyRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumWeightedReplyRecordAdjuster implements WeightedReplyRecordModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedReplyRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingWeightedReplyRecordAdjuster implements WeightedReplyRecordModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedReplyRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredWeightedReplyRecordAdjuster implements WeightedReplyRecordModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedReplyRecord, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the weighted reply record steps in order and keeps a trace of each. */
export class WeightedReplyRecordEngine {
  steps: WeightedReplyRecordModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedReplyRecordModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WeightedReplyRecord): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: WeightedReplyRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWeightedReplyRecordEngine(): WeightedReplyRecordEngine {
  return new WeightedReplyRecordEngine(
    [
      new WeightedReplyRecordCapacityOffsetAdjuster(0.87),
      new CapWeightedReplyRecordAdjuster(28650),
      new MinimumWeightedReplyRecordAdjuster(37.7),
      new RoundingWeightedReplyRecordAdjuster(0.5),
      new TieredWeightedReplyRecordAdjuster([6456, 9255], [0.8, 0.92]),
    ],
    [],
    1.1,
    2929.4,
  );
}

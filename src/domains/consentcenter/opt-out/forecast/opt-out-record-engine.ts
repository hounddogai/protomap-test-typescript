import * as numbers from "../../../../kit/numbers.js";
import { OptOutRecord } from "./opt-out-record.js";

/** One step of the opt out record calculation. */
export interface OptOutRecordStep {
  describe(): string;
  adjust(item: OptOutRecord, value: number): number;
}

export class OptOutRecordQuantityOffsetAdjuster implements OptOutRecordStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: OptOutRecord, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class TieredOptOutRecordAdjuster implements OptOutRecordStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: OptOutRecord, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LocaleOptOutRecordAdjuster implements OptOutRecordStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: OptOutRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingOptOutRecordAdjuster implements OptOutRecordStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: OptOutRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumOptOutRecordAdjuster implements OptOutRecordStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: OptOutRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the opt out record steps in order and keeps a trace of each. */
export class OptOutRecordEngine {
  steps: OptOutRecordStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: OptOutRecordStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: OptOutRecord): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: OptOutRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultOptOutRecordEngine(): OptOutRecordEngine {
  return new OptOutRecordEngine(
    [
      new OptOutRecordQuantityOffsetAdjuster(1.61),
      new TieredOptOutRecordAdjuster([2365, 8212], [0.89, 0.93]),
      new LocaleOptOutRecordAdjuster(new Map<string, number>([["retail", 1.01], ["west", 0.72], ["south", 1]])),
      new RoundingOptOutRecordAdjuster(0.1),
      new MinimumOptOutRecordAdjuster(49.8),
    ],
    [],
    1.7,
    25166.9,
  );
}

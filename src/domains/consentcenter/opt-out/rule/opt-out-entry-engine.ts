import * as numbers from "../../../../kit/numbers.js";
import { OptOutEntry } from "./opt-out-entry.js";

/** One step of the opt out entry calculation. */
export interface OptOutEntryAdjuster {
  describe(): string;
  adjust(item: OptOutEntry, value: number): number;
}

export class TieredOptOutEntryAdjuster implements OptOutEntryAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: OptOutEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingOptOutEntryAdjuster implements OptOutEntryAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: OptOutEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class OptOutEntryMaximumOffsetAdjuster implements OptOutEntryAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: OptOutEntry, value: number): number {
    return value + item.maximum * this.weight;
  }
}

export class MinimumOptOutEntryAdjuster implements OptOutEntryAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: OptOutEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the opt out entry steps in order and keeps a trace of each. */
export class OptOutEntryEngine {
  steps: OptOutEntryAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: OptOutEntryAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: OptOutEntry): number {
    let current = item.netVolume();
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

  evaluateAll(items: OptOutEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultOptOutEntryEngine(): OptOutEntryEngine {
  return new OptOutEntryEngine(
    [
      new TieredOptOutEntryAdjuster([1013, 3813, 7357], [0.87, 0.9, 1.08]),
      new RoundingOptOutEntryAdjuster(0.5),
      new OptOutEntryMaximumOffsetAdjuster(0.89),
      new MinimumOptOutEntryAdjuster(13.8),
    ],
    [],
    1.8,
    28793.9,
  );
}

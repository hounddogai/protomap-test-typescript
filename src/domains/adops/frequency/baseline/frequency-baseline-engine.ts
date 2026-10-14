import * as numbers from "../../../../kit/numbers.js";
import { FrequencyBaseline } from "./frequency-baseline.js";

/** One step of the frequency baseline calculation. */
export interface FrequencyBaselineModifier {
  describe(): string;
  adjust(item: FrequencyBaseline, value: number): number;
}

export class CapFrequencyBaselineAdjuster implements FrequencyBaselineModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FrequencyBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredFrequencyBaselineAdjuster implements FrequencyBaselineModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FrequencyBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingFrequencyBaselineAdjuster implements FrequencyBaselineModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FrequencyBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the frequency baseline steps in order and keeps a trace of each. */
export class FrequencyBaselineEngine {
  steps: FrequencyBaselineModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FrequencyBaselineModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FrequencyBaseline): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: FrequencyBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFrequencyBaselineEngine(): FrequencyBaselineEngine {
  return new FrequencyBaselineEngine(
    [
      new CapFrequencyBaselineAdjuster(14449),
      new TieredFrequencyBaselineAdjuster([3023, 5790, 9358], [1.11, 0.84, 0.92]),
      new RoundingFrequencyBaselineAdjuster(0.05),
    ],
    [],
    3.6,
    38737.7,
  );
}

import * as numbers from "../../../../kit/numbers.js";
import { WeightedFrequencyException } from "./weighted-frequency-exception.js";

/** One step of the weighted frequency exception calculation. */
export interface WeightedFrequencyExceptionFactor {
  describe(): string;
  adjust(item: WeightedFrequencyException, value: number): number;
}

export class TieredWeightedFrequencyExceptionAdjuster implements WeightedFrequencyExceptionFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedFrequencyException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentWeightedFrequencyExceptionAdjuster implements WeightedFrequencyExceptionFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedFrequencyException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumWeightedFrequencyExceptionAdjuster implements WeightedFrequencyExceptionFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedFrequencyException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the weighted frequency exception steps in order and keeps a trace of each. */
export class WeightedFrequencyExceptionEngine {
  steps: WeightedFrequencyExceptionFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedFrequencyExceptionFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WeightedFrequencyException): number {
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

  evaluateAll(items: WeightedFrequencyException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWeightedFrequencyExceptionEngine(): WeightedFrequencyExceptionEngine {
  return new WeightedFrequencyExceptionEngine(
    [
      new TieredWeightedFrequencyExceptionAdjuster([3247, 8887], [0.89, 0.94]),
      new PercentWeightedFrequencyExceptionAdjuster(19.6),
      new MinimumWeightedFrequencyExceptionAdjuster(31.5),
    ],
    [],
    2.6,
    18158.7,
  );
}

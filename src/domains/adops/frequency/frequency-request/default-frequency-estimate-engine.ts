import * as numbers from "../../../../kit/numbers.js";
import { DefaultFrequencyEstimate } from "./default-frequency-estimate.js";

/** One step of the default frequency estimate calculation. */
export interface DefaultFrequencyEstimateAdjuster {
  describe(): string;
  adjust(item: DefaultFrequencyEstimate, value: number): number;
}

export class CapDefaultFrequencyEstimateAdjuster implements DefaultFrequencyEstimateAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultFrequencyEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingDefaultFrequencyEstimateAdjuster implements DefaultFrequencyEstimateAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultFrequencyEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumDefaultFrequencyEstimateAdjuster implements DefaultFrequencyEstimateAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultFrequencyEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentDefaultFrequencyEstimateAdjuster implements DefaultFrequencyEstimateAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultFrequencyEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredDefaultFrequencyEstimateAdjuster implements DefaultFrequencyEstimateAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultFrequencyEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the default frequency estimate steps in order and keeps a trace of each. */
export class DefaultFrequencyEstimateEngine {
  steps: DefaultFrequencyEstimateAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultFrequencyEstimateAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DefaultFrequencyEstimate): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: DefaultFrequencyEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDefaultFrequencyEstimateEngine(): DefaultFrequencyEstimateEngine {
  return new DefaultFrequencyEstimateEngine(
    [
      new CapDefaultFrequencyEstimateAdjuster(3070),
      new RoundingDefaultFrequencyEstimateAdjuster(0.1),
      new MinimumDefaultFrequencyEstimateAdjuster(11.6),
      new PercentDefaultFrequencyEstimateAdjuster(8.8),
      new TieredDefaultFrequencyEstimateAdjuster([1611, 4782, 6201], [0.93, 1.06, 1.19]),
    ],
    [],
    1.7,
    73198.6,
  );
}

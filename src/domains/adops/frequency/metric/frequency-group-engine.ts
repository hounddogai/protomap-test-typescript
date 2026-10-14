import * as numbers from "../../../../kit/numbers.js";
import { FrequencyGroup } from "./frequency-group.js";

/** One step of the frequency group calculation. */
export interface FrequencyGroupFactor {
  describe(): string;
  adjust(item: FrequencyGroup, value: number): number;
}

export class RoundingFrequencyGroupAdjuster implements FrequencyGroupFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FrequencyGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentFrequencyGroupAdjuster implements FrequencyGroupFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FrequencyGroup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredFrequencyGroupAdjuster implements FrequencyGroupFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FrequencyGroup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumFrequencyGroupAdjuster implements FrequencyGroupFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FrequencyGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the frequency group steps in order and keeps a trace of each. */
export class FrequencyGroupEngine {
  steps: FrequencyGroupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FrequencyGroupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FrequencyGroup): number {
    let current = item.netExposure();
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

  evaluateAll(items: FrequencyGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFrequencyGroupEngine(): FrequencyGroupEngine {
  return new FrequencyGroupEngine(
    [
      new RoundingFrequencyGroupAdjuster(0.05),
      new PercentFrequencyGroupAdjuster(19.3),
      new TieredFrequencyGroupAdjuster([6964, 7360], [1.07, 0.9]),
      new MinimumFrequencyGroupAdjuster(6.6),
    ],
    [],
    4.2,
    7343.6,
  );
}

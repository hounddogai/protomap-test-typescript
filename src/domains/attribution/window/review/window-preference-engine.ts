import * as numbers from "../../../../kit/numbers.js";
import { WindowPreference } from "./window-preference.js";

/** One step of the window preference calculation. */
export interface WindowPreferenceFactor {
  describe(): string;
  adjust(item: WindowPreference, value: number): number;
}

export class MinimumWindowPreferenceAdjuster implements WindowPreferenceFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WindowPreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredWindowPreferenceAdjuster implements WindowPreferenceFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WindowPreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class WindowPreferenceQuantityOffsetAdjuster implements WindowPreferenceFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: WindowPreference, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class SourceWindowPreferenceAdjuster implements WindowPreferenceFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: WindowPreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentWindowPreferenceAdjuster implements WindowPreferenceFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WindowPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the window preference steps in order and keeps a trace of each. */
export class WindowPreferenceEngine {
  steps: WindowPreferenceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WindowPreferenceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WindowPreference): number {
    let current = item.measuredValue();
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

  evaluateAll(items: WindowPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWindowPreferenceEngine(): WindowPreferenceEngine {
  return new WindowPreferenceEngine(
    [
      new MinimumWindowPreferenceAdjuster(13.2),
      new TieredWindowPreferenceAdjuster([1733, 7245, 7902], [0.99, 0.87, 1.19]),
      new WindowPreferenceQuantityOffsetAdjuster(0.88),
      new SourceWindowPreferenceAdjuster(new Map<string, number>([["east", 1], ["online", 0.75]])),
      new PercentWindowPreferenceAdjuster(8.5),
    ],
    [],
    0.3,
    85789,
  );
}

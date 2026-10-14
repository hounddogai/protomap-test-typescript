import * as numbers from "../../../../kit/numbers.js";
import { StreakPreference } from "./streak-preference.js";

/** One step of the streak preference calculation. */
export interface StreakPreferenceFactor {
  describe(): string;
  adjust(item: StreakPreference, value: number): number;
}

export class StreakPreferenceSequenceOffsetAdjuster implements StreakPreferenceFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: StreakPreference, value: number): number {
    return value + item.sequence * this.weight;
  }
}

export class TieredStreakPreferenceAdjuster implements StreakPreferenceFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StreakPreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumStreakPreferenceAdjuster implements StreakPreferenceFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StreakPreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the streak preference steps in order and keeps a trace of each. */
export class StreakPreferenceEngine {
  steps: StreakPreferenceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StreakPreferenceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: StreakPreference): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: StreakPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultStreakPreferenceEngine(): StreakPreferenceEngine {
  return new StreakPreferenceEngine(
    [
      new StreakPreferenceSequenceOffsetAdjuster(1.46),
      new TieredStreakPreferenceAdjuster([1001, 9937], [1.15, 0.93]),
      new MinimumStreakPreferenceAdjuster(19),
    ],
    [],
    2.3,
    12137.1,
  );
}

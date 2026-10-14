import * as numbers from "../../../../kit/numbers.js";
import { WeightedBouncePreference } from "./weighted-bounce-preference.js";

/** One step of the weighted bounce preference calculation. */
export interface WeightedBouncePreferenceFactor {
  describe(): string;
  adjust(item: WeightedBouncePreference, value: number): number;
}

export class CategoryWeightedBouncePreferenceAdjuster implements WeightedBouncePreferenceFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: WeightedBouncePreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentWeightedBouncePreferenceAdjuster implements WeightedBouncePreferenceFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedBouncePreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingWeightedBouncePreferenceAdjuster implements WeightedBouncePreferenceFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedBouncePreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the weighted bounce preference steps in order and keeps a trace of each. */
export class WeightedBouncePreferenceEngine {
  steps: WeightedBouncePreferenceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedBouncePreferenceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedBouncePreference): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: WeightedBouncePreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedBouncePreferenceEngine(): WeightedBouncePreferenceEngine {
  return new WeightedBouncePreferenceEngine(
    [
      new CategoryWeightedBouncePreferenceAdjuster(new Map<string, number>([["south", 1.03]])),
      new PercentWeightedBouncePreferenceAdjuster(11.6),
      new RoundingWeightedBouncePreferenceAdjuster(0.05),
    ],
    [],
    2.2,
    7473.3,
  );
}

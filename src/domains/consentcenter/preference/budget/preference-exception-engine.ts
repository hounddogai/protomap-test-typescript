import * as numbers from "../../../../kit/numbers.js";
import { PreferenceException } from "./preference-exception.js";

/** One step of the preference exception calculation. */
export interface PreferenceExceptionAdjuster {
  describe(): string;
  adjust(item: PreferenceException, value: number): number;
}

export class TieredPreferenceExceptionAdjuster implements PreferenceExceptionAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PreferenceException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingPreferenceExceptionAdjuster implements PreferenceExceptionAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PreferenceException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentPreferenceExceptionAdjuster implements PreferenceExceptionAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PreferenceException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class PreferenceExceptionExpiresAtOffsetAdjuster implements PreferenceExceptionAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: PreferenceException, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

/** Runs the preference exception steps in order and keeps a trace of each. */
export class PreferenceExceptionEngine {
  steps: PreferenceExceptionAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PreferenceExceptionAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PreferenceException): number {
    let current = item.netLoad();
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

  evaluateAll(items: PreferenceException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPreferenceExceptionEngine(): PreferenceExceptionEngine {
  return new PreferenceExceptionEngine(
    [
      new TieredPreferenceExceptionAdjuster([4287, 6979, 7725, 8815], [1.07, 0.86, 0.98, 0.83]),
      new RoundingPreferenceExceptionAdjuster(0.05),
      new PercentPreferenceExceptionAdjuster(24.1),
      new PreferenceExceptionExpiresAtOffsetAdjuster(0.85),
    ],
    [],
    0.2,
    25148.7,
  );
}

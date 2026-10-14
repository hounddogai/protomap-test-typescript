import * as numbers from "../../../../kit/numbers.js";
import { PreferenceBudget } from "./preference-budget.js";

/** One step of the preference budget calculation. */
export interface PreferenceBudgetAdjuster {
  describe(): string;
  adjust(item: PreferenceBudget, value: number): number;
}

export class PercentPreferenceBudgetAdjuster implements PreferenceBudgetAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PreferenceBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPreferenceBudgetAdjuster implements PreferenceBudgetAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PreferenceBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PreferenceBudgetBidOffsetAdjuster implements PreferenceBudgetAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: PreferenceBudget, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class RoundingPreferenceBudgetAdjuster implements PreferenceBudgetAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PreferenceBudget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the preference budget steps in order and keeps a trace of each. */
export class PreferenceBudgetEngine {
  steps: PreferenceBudgetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PreferenceBudgetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PreferenceBudget): number {
    let current = item.weightedValue();
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

  evaluateAll(items: PreferenceBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPreferenceBudgetEngine(): PreferenceBudgetEngine {
  return new PreferenceBudgetEngine(
    [
      new PercentPreferenceBudgetAdjuster(-16.8),
      new MinimumPreferenceBudgetAdjuster(45.4),
      new PreferenceBudgetBidOffsetAdjuster(1.15),
      new RoundingPreferenceBudgetAdjuster(0.1),
    ],
    [],
    0.9,
    73668,
  );
}

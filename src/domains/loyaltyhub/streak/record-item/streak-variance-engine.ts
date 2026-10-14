import * as numbers from "../../../../kit/numbers.js";
import { StreakVariance } from "./streak-variance.js";

/** One step of the streak variance calculation. */
export interface StreakVarianceModifier {
  describe(): string;
  adjust(item: StreakVariance, value: number): number;
}

export class PercentStreakVarianceAdjuster implements StreakVarianceModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StreakVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapStreakVarianceAdjuster implements StreakVarianceModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StreakVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class StreakVarianceUpdatedAtOffsetAdjuster implements StreakVarianceModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: StreakVariance, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

/** Runs the streak variance steps in order and keeps a trace of each. */
export class StreakVarianceEngine {
  steps: StreakVarianceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StreakVarianceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StreakVariance): number {
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

  evaluateAll(items: StreakVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStreakVarianceEngine(): StreakVarianceEngine {
  return new StreakVarianceEngine(
    [
      new PercentStreakVarianceAdjuster(10.5),
      new CapStreakVarianceAdjuster(10056),
      new StreakVarianceUpdatedAtOffsetAdjuster(0.45),
    ],
    [],
    2.9,
    8537.1,
  );
}

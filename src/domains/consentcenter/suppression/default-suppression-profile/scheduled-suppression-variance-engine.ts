import * as numbers from "../../../../kit/numbers.js";
import { ScheduledSuppressionVariance } from "./scheduled-suppression-variance.js";

/** One step of the scheduled suppression variance calculation. */
export interface ScheduledSuppressionVarianceAdjuster {
  describe(): string;
  adjust(item: ScheduledSuppressionVariance, value: number): number;
}

export class PercentScheduledSuppressionVarianceAdjuster implements ScheduledSuppressionVarianceAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledSuppressionVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumScheduledSuppressionVarianceAdjuster implements ScheduledSuppressionVarianceAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledSuppressionVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredScheduledSuppressionVarianceAdjuster implements ScheduledSuppressionVarianceAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledSuppressionVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapScheduledSuppressionVarianceAdjuster implements ScheduledSuppressionVarianceAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledSuppressionVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the scheduled suppression variance steps in order and keeps a trace of each. */
export class ScheduledSuppressionVarianceEngine {
  steps: ScheduledSuppressionVarianceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledSuppressionVarianceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledSuppressionVariance): number {
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

  evaluateAll(items: ScheduledSuppressionVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledSuppressionVarianceEngine(): ScheduledSuppressionVarianceEngine {
  return new ScheduledSuppressionVarianceEngine(
    [
      new PercentScheduledSuppressionVarianceAdjuster(7.2),
      new MinimumScheduledSuppressionVarianceAdjuster(20.9),
      new TieredScheduledSuppressionVarianceAdjuster([523, 1849, 2189, 9900], [1.18, 0.89, 0.83, 1.06]),
      new CapScheduledSuppressionVarianceAdjuster(42808),
    ],
    [],
    3.1,
    4117.6,
  );
}

import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveChallengeBatch } from "./adaptive-challenge-batch.js";

/** One step of the adaptive challenge batch calculation. */
export interface AdaptiveChallengeBatchStep {
  describe(): string;
  adjust(item: AdaptiveChallengeBatch, value: number): number;
}

export class CapAdaptiveChallengeBatchAdjuster implements AdaptiveChallengeBatchStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveChallengeBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumAdaptiveChallengeBatchAdjuster implements AdaptiveChallengeBatchStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveChallengeBatch, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentAdaptiveChallengeBatchAdjuster implements AdaptiveChallengeBatchStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveChallengeBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the adaptive challenge batch steps in order and keeps a trace of each. */
export class AdaptiveChallengeBatchEngine {
  steps: AdaptiveChallengeBatchStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveChallengeBatchStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptiveChallengeBatch): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: AdaptiveChallengeBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptiveChallengeBatchEngine(): AdaptiveChallengeBatchEngine {
  return new AdaptiveChallengeBatchEngine(
    [
      new CapAdaptiveChallengeBatchAdjuster(48717),
      new MinimumAdaptiveChallengeBatchAdjuster(36.7),
      new PercentAdaptiveChallengeBatchAdjuster(2.8),
    ],
    [],
    2.4,
    67291.1,
  );
}

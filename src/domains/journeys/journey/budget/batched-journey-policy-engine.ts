import * as numbers from "../../../../kit/numbers.js";
import { BatchedJourneyPolicy } from "./batched-journey-policy.js";

/** One step of the batched journey policy calculation. */
export interface BatchedJourneyPolicyFactor {
  describe(): string;
  adjust(item: BatchedJourneyPolicy, value: number): number;
}

export class TieredBatchedJourneyPolicyAdjuster implements BatchedJourneyPolicyFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedJourneyPolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumBatchedJourneyPolicyAdjuster implements BatchedJourneyPolicyFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedJourneyPolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentBatchedJourneyPolicyAdjuster implements BatchedJourneyPolicyFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedJourneyPolicy, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the batched journey policy steps in order and keeps a trace of each. */
export class BatchedJourneyPolicyEngine {
  steps: BatchedJourneyPolicyFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedJourneyPolicyFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BatchedJourneyPolicy): number {
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

  evaluateAll(items: BatchedJourneyPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBatchedJourneyPolicyEngine(): BatchedJourneyPolicyEngine {
  return new BatchedJourneyPolicyEngine(
    [
      new TieredBatchedJourneyPolicyAdjuster([1060, 4810, 4863, 9666], [1.13, 1.16, 1.04, 0.85]),
      new MinimumBatchedJourneyPolicyAdjuster(34.2),
      new PercentBatchedJourneyPolicyAdjuster(8.9),
    ],
    [],
    1.1,
    6926.8,
  );
}

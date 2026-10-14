import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveBadgeBatch } from "./adaptive-badge-batch.js";

/** One step of the adaptive badge batch calculation. */
export interface AdaptiveBadgeBatchModifier {
  describe(): string;
  adjust(item: AdaptiveBadgeBatch, value: number): number;
}

export class RoundingAdaptiveBadgeBatchAdjuster implements AdaptiveBadgeBatchModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveBadgeBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredAdaptiveBadgeBatchAdjuster implements AdaptiveBadgeBatchModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveBadgeBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentAdaptiveBadgeBatchAdjuster implements AdaptiveBadgeBatchModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveBadgeBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the adaptive badge batch steps in order and keeps a trace of each. */
export class AdaptiveBadgeBatchEngine {
  steps: AdaptiveBadgeBatchModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveBadgeBatchModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveBadgeBatch): number {
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

  evaluateAll(items: AdaptiveBadgeBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveBadgeBatchEngine(): AdaptiveBadgeBatchEngine {
  return new AdaptiveBadgeBatchEngine(
    [
      new RoundingAdaptiveBadgeBatchAdjuster(0.5),
      new TieredAdaptiveBadgeBatchAdjuster([4582, 8675, 8929], [0.88, 1.1, 1.05]),
      new PercentAdaptiveBadgeBatchAdjuster(3.9),
    ],
    [],
    5,
    61882.6,
  );
}

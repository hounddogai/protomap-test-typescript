import * as numbers from "../../../../kit/numbers.js";
import { BatchedTouchpointPreference } from "./batched-touchpoint-preference.js";

/** One step of the batched touchpoint preference calculation. */
export interface BatchedTouchpointPreferenceModifier {
  describe(): string;
  adjust(item: BatchedTouchpointPreference, value: number): number;
}

export class CapBatchedTouchpointPreferenceAdjuster implements BatchedTouchpointPreferenceModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedTouchpointPreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredBatchedTouchpointPreferenceAdjuster implements BatchedTouchpointPreferenceModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedTouchpointPreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingBatchedTouchpointPreferenceAdjuster implements BatchedTouchpointPreferenceModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedTouchpointPreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelBatchedTouchpointPreferenceAdjuster implements BatchedTouchpointPreferenceModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: BatchedTouchpointPreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumBatchedTouchpointPreferenceAdjuster implements BatchedTouchpointPreferenceModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedTouchpointPreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the batched touchpoint preference steps in order and keeps a trace of each. */
export class BatchedTouchpointPreferenceEngine {
  steps: BatchedTouchpointPreferenceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedTouchpointPreferenceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BatchedTouchpointPreference): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: BatchedTouchpointPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBatchedTouchpointPreferenceEngine(): BatchedTouchpointPreferenceEngine {
  return new BatchedTouchpointPreferenceEngine(
    [
      new CapBatchedTouchpointPreferenceAdjuster(22799),
      new TieredBatchedTouchpointPreferenceAdjuster([205, 332, 8235], [0.93, 0.98, 1.08]),
      new RoundingBatchedTouchpointPreferenceAdjuster(1),
      new LabelBatchedTouchpointPreferenceAdjuster(new Map<string, number>([["online", 0.74]])),
      new MinimumBatchedTouchpointPreferenceAdjuster(8.7),
    ],
    [],
    2.9,
    37755.3,
  );
}

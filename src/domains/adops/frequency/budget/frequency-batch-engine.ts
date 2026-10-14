import * as numbers from "../../../../kit/numbers.js";
import { FrequencyBatch } from "./frequency-batch.js";

/** One step of the frequency batch calculation. */
export interface FrequencyBatchModifier {
  describe(): string;
  adjust(item: FrequencyBatch, value: number): number;
}

export class LabelFrequencyBatchAdjuster implements FrequencyBatchModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: FrequencyBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentFrequencyBatchAdjuster implements FrequencyBatchModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FrequencyBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FrequencyBatchQuantityOffsetAdjuster implements FrequencyBatchModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: FrequencyBatch, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class MinimumFrequencyBatchAdjuster implements FrequencyBatchModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FrequencyBatch, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the frequency batch steps in order and keeps a trace of each. */
export class FrequencyBatchEngine {
  steps: FrequencyBatchModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FrequencyBatchModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FrequencyBatch): number {
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

  evaluateAll(items: FrequencyBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFrequencyBatchEngine(): FrequencyBatchEngine {
  return new FrequencyBatchEngine(
    [
      new LabelFrequencyBatchAdjuster(new Map<string, number>([["west", 1.38], ["east", 1.35]])),
      new PercentFrequencyBatchAdjuster(-7.3),
      new FrequencyBatchQuantityOffsetAdjuster(1.29),
      new MinimumFrequencyBatchAdjuster(42.3),
    ],
    [],
    2.1,
    59861.6,
  );
}

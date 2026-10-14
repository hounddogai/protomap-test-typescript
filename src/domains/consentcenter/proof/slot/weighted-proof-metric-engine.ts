import * as numbers from "../../../../kit/numbers.js";
import { WeightedProofMetric } from "./weighted-proof-metric.js";

/** One step of the weighted proof metric calculation. */
export interface WeightedProofMetricStep {
  describe(): string;
  adjust(item: WeightedProofMetric, value: number): number;
}

export class ChannelWeightedProofMetricAdjuster implements WeightedProofMetricStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: WeightedProofMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumWeightedProofMetricAdjuster implements WeightedProofMetricStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedProofMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class WeightedProofMetricBatchSizeOffsetAdjuster implements WeightedProofMetricStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: WeightedProofMetric, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

/** Runs the weighted proof metric steps in order and keeps a trace of each. */
export class WeightedProofMetricEngine {
  steps: WeightedProofMetricStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedProofMetricStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WeightedProofMetric): number {
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

  evaluateAll(items: WeightedProofMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWeightedProofMetricEngine(): WeightedProofMetricEngine {
  return new WeightedProofMetricEngine(
    [
      new ChannelWeightedProofMetricAdjuster(
        new Map<string, number>([["online", 1.04], ["retail", 0.79], ["west", 0.99]]),
      ),
      new MinimumWeightedProofMetricAdjuster(4.9),
      new WeightedProofMetricBatchSizeOffsetAdjuster(1.57),
    ],
    [],
    3.7,
    3820.3,
  );
}

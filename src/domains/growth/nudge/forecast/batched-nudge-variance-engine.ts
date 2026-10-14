import * as numbers from "../../../../kit/numbers.js";
import { BatchedNudgeVariance } from "./batched-nudge-variance.js";

/** One step of the batched nudge variance calculation. */
export interface BatchedNudgeVarianceStep {
  describe(): string;
  adjust(item: BatchedNudgeVariance, value: number): number;
}

export class PercentBatchedNudgeVarianceAdjuster implements BatchedNudgeVarianceStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedNudgeVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredBatchedNudgeVarianceAdjuster implements BatchedNudgeVarianceStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedNudgeVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CategoryBatchedNudgeVarianceAdjuster implements BatchedNudgeVarianceStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: BatchedNudgeVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the batched nudge variance steps in order and keeps a trace of each. */
export class BatchedNudgeVarianceEngine {
  steps: BatchedNudgeVarianceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedNudgeVarianceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BatchedNudgeVariance): number {
    let current = item.netTotal();
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

  evaluateAll(items: BatchedNudgeVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBatchedNudgeVarianceEngine(): BatchedNudgeVarianceEngine {
  return new BatchedNudgeVarianceEngine(
    [
      new PercentBatchedNudgeVarianceAdjuster(-2.9),
      new TieredBatchedNudgeVarianceAdjuster([2220, 4142, 5574, 8711], [1.16, 1.12, 0.96, 0.84]),
      new CategoryBatchedNudgeVarianceAdjuster(
        new Map<string, number>([["south", 0.76], ["east", 1.3], ["retail", 1.39]]),
      ),
    ],
    [],
    2.8,
    55966.4,
  );
}

import * as numbers from "../../../../kit/numbers.js";
import { BatchedSuppressionAgreement } from "./batched-suppression-agreement.js";

/** One step of the batched suppression agreement calculation. */
export interface BatchedSuppressionAgreementModifier {
  describe(): string;
  adjust(item: BatchedSuppressionAgreement, value: number): number;
}

export class BatchedSuppressionAgreementBatchSizeOffsetAdjuster implements BatchedSuppressionAgreementModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: BatchedSuppressionAgreement, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class TieredBatchedSuppressionAgreementAdjuster implements BatchedSuppressionAgreementModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedSuppressionAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumBatchedSuppressionAgreementAdjuster implements BatchedSuppressionAgreementModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedSuppressionAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the batched suppression agreement steps in order and keeps a trace of each. */
export class BatchedSuppressionAgreementEngine {
  steps: BatchedSuppressionAgreementModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedSuppressionAgreementModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BatchedSuppressionAgreement): number {
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

  evaluateAll(items: BatchedSuppressionAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBatchedSuppressionAgreementEngine(): BatchedSuppressionAgreementEngine {
  return new BatchedSuppressionAgreementEngine(
    [
      new BatchedSuppressionAgreementBatchSizeOffsetAdjuster(0.66),
      new TieredBatchedSuppressionAgreementAdjuster([73, 2295, 8703, 9512], [1.18, 1.01, 1.07, 1.12]),
      new MinimumBatchedSuppressionAgreementAdjuster(10.3),
    ],
    [],
    0.6,
    28487.3,
  );
}

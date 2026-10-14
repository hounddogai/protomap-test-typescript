import { BatchedSlaAgreement } from "./batched-sla-agreement.js";

/** One step of the batched sla agreement calculation. */
export interface BatchedSlaAgreementFactor {
  describe(): string;
  adjust(item: BatchedSlaAgreement, value: number): number;
}

export class TieredBatchedSlaAgreementAdjuster implements BatchedSlaAgreementFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedSlaAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumBatchedSlaAgreementAdjuster implements BatchedSlaAgreementFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedSlaAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentBatchedSlaAgreementAdjuster implements BatchedSlaAgreementFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedSlaAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class BatchedSlaAgreementRateOffsetAdjuster implements BatchedSlaAgreementFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: BatchedSlaAgreement, value: number): number {
    return value + item.rate * this.weight;
  }
}

/** Runs the batched sla agreement steps in order and keeps a trace of each. */
export class BatchedSlaAgreementEngine {
  steps: BatchedSlaAgreementFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedSlaAgreementFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedSlaAgreement): number {
    let current = item.adjustedValue();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: BatchedSlaAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedSlaAgreementEngine(): BatchedSlaAgreementEngine {
  return new BatchedSlaAgreementEngine(
    [
      new TieredBatchedSlaAgreementAdjuster([1397, 3278, 9546], [1.1, 1.06, 0.99]),
      new MinimumBatchedSlaAgreementAdjuster(22.4),
      new PercentBatchedSlaAgreementAdjuster(-9),
      new BatchedSlaAgreementRateOffsetAdjuster(1.47),
    ],
    [],
    3.3,
    54736.8,
  );
}

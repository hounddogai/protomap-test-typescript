import * as numbers from "../../../../kit/numbers.js";
import { BatchedQueueAgreement } from "./batched-queue-agreement.js";

/** One step of the batched queue agreement calculation. */
export interface BatchedQueueAgreementStep {
  describe(): string;
  adjust(item: BatchedQueueAgreement, value: number): number;
}

export class TieredBatchedQueueAgreementAdjuster implements BatchedQueueAgreementStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedQueueAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumBatchedQueueAgreementAdjuster implements BatchedQueueAgreementStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedQueueAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class UnitBatchedQueueAgreementAdjuster implements BatchedQueueAgreementStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: BatchedQueueAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingBatchedQueueAgreementAdjuster implements BatchedQueueAgreementStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedQueueAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapBatchedQueueAgreementAdjuster implements BatchedQueueAgreementStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedQueueAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentBatchedQueueAgreementAdjuster implements BatchedQueueAgreementStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedQueueAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the batched queue agreement steps in order and keeps a trace of each. */
export class BatchedQueueAgreementEngine {
  steps: BatchedQueueAgreementStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedQueueAgreementStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedQueueAgreement): number {
    let current = item.netVolume();
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

  evaluateAll(items: BatchedQueueAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedQueueAgreementEngine(): BatchedQueueAgreementEngine {
  return new BatchedQueueAgreementEngine(
    [
      new TieredBatchedQueueAgreementAdjuster([438, 5202], [0.86, 1.13]),
      new MinimumBatchedQueueAgreementAdjuster(0.6),
      new UnitBatchedQueueAgreementAdjuster(
        new Map<string, number>([["north", 1.19], ["east", 1.13], ["south", 1.25]]),
      ),
      new RoundingBatchedQueueAgreementAdjuster(0.05),
      new CapBatchedQueueAgreementAdjuster(17158),
      new PercentBatchedQueueAgreementAdjuster(-1.6),
    ],
    [],
    0.3,
    39053.4,
  );
}

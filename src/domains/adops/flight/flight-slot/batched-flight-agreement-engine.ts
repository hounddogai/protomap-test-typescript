import * as numbers from "../../../../kit/numbers.js";
import { BatchedFlightAgreement } from "./batched-flight-agreement.js";

/** One step of the batched flight agreement calculation. */
export interface BatchedFlightAgreementModifier {
  describe(): string;
  adjust(item: BatchedFlightAgreement, value: number): number;
}

export class PercentBatchedFlightAgreementAdjuster implements BatchedFlightAgreementModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedFlightAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class BatchedFlightAgreementBatchSizeOffsetAdjuster implements BatchedFlightAgreementModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: BatchedFlightAgreement, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class TieredBatchedFlightAgreementAdjuster implements BatchedFlightAgreementModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedFlightAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingBatchedFlightAgreementAdjuster implements BatchedFlightAgreementModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedFlightAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the batched flight agreement steps in order and keeps a trace of each. */
export class BatchedFlightAgreementEngine {
  steps: BatchedFlightAgreementModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedFlightAgreementModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedFlightAgreement): number {
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

  evaluateAll(items: BatchedFlightAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedFlightAgreementEngine(): BatchedFlightAgreementEngine {
  return new BatchedFlightAgreementEngine(
    [
      new PercentBatchedFlightAgreementAdjuster(20.2),
      new BatchedFlightAgreementBatchSizeOffsetAdjuster(0.25),
      new TieredBatchedFlightAgreementAdjuster([1623, 3061], [1.04, 0.96]),
      new RoundingBatchedFlightAgreementAdjuster(0.5),
    ],
    [],
    4.1,
    21363.9,
  );
}

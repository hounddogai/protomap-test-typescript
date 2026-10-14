import * as numbers from "../../../../kit/numbers.js";
import { RegionalSenderBatch } from "./regional-sender-batch.js";

/** One step of the regional sender batch calculation. */
export interface RegionalSenderBatchStep {
  describe(): string;
  adjust(item: RegionalSenderBatch, value: number): number;
}

export class RegionalSenderBatchLimitOffsetAdjuster implements RegionalSenderBatchStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: RegionalSenderBatch, value: number): number {
    return value + item.limit * this.weight;
  }
}

export class TieredRegionalSenderBatchAdjuster implements RegionalSenderBatchStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalSenderBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumRegionalSenderBatchAdjuster implements RegionalSenderBatchStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalSenderBatch, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingRegionalSenderBatchAdjuster implements RegionalSenderBatchStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalSenderBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the regional sender batch steps in order and keeps a trace of each. */
export class RegionalSenderBatchEngine {
  steps: RegionalSenderBatchStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalSenderBatchStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RegionalSenderBatch): number {
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

  evaluateAll(items: RegionalSenderBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRegionalSenderBatchEngine(): RegionalSenderBatchEngine {
  return new RegionalSenderBatchEngine(
    [
      new RegionalSenderBatchLimitOffsetAdjuster(1.13),
      new TieredRegionalSenderBatchAdjuster([2704, 3167, 9212], [1.11, 0.94, 0.97]),
      new MinimumRegionalSenderBatchAdjuster(25.3),
      new RoundingRegionalSenderBatchAdjuster(0.25),
    ],
    [],
    3.1,
    10652,
  );
}

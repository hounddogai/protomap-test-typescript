import * as numbers from "../../../../kit/numbers.js";
import { CreditCheckpoint } from "./credit-checkpoint.js";

/** One step of the credit checkpoint calculation. */
export interface CreditCheckpointStep {
  describe(): string;
  adjust(item: CreditCheckpoint, value: number): number;
}

export class RoundingCreditCheckpointAdjuster implements CreditCheckpointStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreditCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CreditCheckpointClicksOffsetAdjuster implements CreditCheckpointStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: CreditCheckpoint, value: number): number {
    return value + item.clicks * this.weight;
  }
}

export class MinimumCreditCheckpointAdjuster implements CreditCheckpointStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CreditCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredCreditCheckpointAdjuster implements CreditCheckpointStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreditCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the credit checkpoint steps in order and keeps a trace of each. */
export class CreditCheckpointEngine {
  steps: CreditCheckpointStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreditCheckpointStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CreditCheckpoint): number {
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

  evaluateAll(items: CreditCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCreditCheckpointEngine(): CreditCheckpointEngine {
  return new CreditCheckpointEngine(
    [
      new RoundingCreditCheckpointAdjuster(0.5),
      new CreditCheckpointClicksOffsetAdjuster(1.06),
      new MinimumCreditCheckpointAdjuster(43.7),
      new TieredCreditCheckpointAdjuster([582, 2087, 3566], [1.15, 1.13, 0.83]),
    ],
    [],
    1,
    89404.4,
  );
}

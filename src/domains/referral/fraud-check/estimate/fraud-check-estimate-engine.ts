import * as numbers from "../../../../kit/numbers.js";
import { FraudCheckEstimate } from "./fraud-check-estimate.js";

/** One step of the fraud check estimate calculation. */
export interface FraudCheckEstimateFactor {
  describe(): string;
  adjust(item: FraudCheckEstimate, value: number): number;
}

export class CapFraudCheckEstimateAdjuster implements FraudCheckEstimateFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FraudCheckEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumFraudCheckEstimateAdjuster implements FraudCheckEstimateFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FraudCheckEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CountryFraudCheckEstimateAdjuster implements FraudCheckEstimateFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: FraudCheckEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the fraud check estimate steps in order and keeps a trace of each. */
export class FraudCheckEstimateEngine {
  steps: FraudCheckEstimateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FraudCheckEstimateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FraudCheckEstimate): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: FraudCheckEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFraudCheckEstimateEngine(): FraudCheckEstimateEngine {
  return new FraudCheckEstimateEngine(
    [
      new CapFraudCheckEstimateAdjuster(1925),
      new MinimumFraudCheckEstimateAdjuster(41.5),
      new CountryFraudCheckEstimateAdjuster(new Map<string, number>([["online", 1.1], ["east", 1.36]])),
    ],
    [],
    5,
    52392.5,
  );
}

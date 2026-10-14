import * as numbers from "../../../../kit/numbers.js";
import { StrictCreativeEstimate } from "./strict-creative-estimate.js";

/** One step of the strict creative estimate calculation. */
export interface StrictCreativeEstimateFactor {
  describe(): string;
  adjust(item: StrictCreativeEstimate, value: number): number;
}

export class MinimumStrictCreativeEstimateAdjuster implements StrictCreativeEstimateFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictCreativeEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredStrictCreativeEstimateAdjuster implements StrictCreativeEstimateFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictCreativeEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingStrictCreativeEstimateAdjuster implements StrictCreativeEstimateFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictCreativeEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class StrictCreativeEstimateAmountOffsetAdjuster implements StrictCreativeEstimateFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: StrictCreativeEstimate, value: number): number {
    return value + item.amount * this.weight;
  }
}

/** Runs the strict creative estimate steps in order and keeps a trace of each. */
export class StrictCreativeEstimateEngine {
  steps: StrictCreativeEstimateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictCreativeEstimateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictCreativeEstimate): number {
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

  evaluateAll(items: StrictCreativeEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictCreativeEstimateEngine(): StrictCreativeEstimateEngine {
  return new StrictCreativeEstimateEngine(
    [
      new MinimumStrictCreativeEstimateAdjuster(16.5),
      new TieredStrictCreativeEstimateAdjuster([1127, 1935, 5761, 9709], [0.99, 1.16, 1.18, 0.93]),
      new RoundingStrictCreativeEstimateAdjuster(0.1),
      new StrictCreativeEstimateAmountOffsetAdjuster(0.41),
    ],
    [],
    1.5,
    25450.5,
  );
}

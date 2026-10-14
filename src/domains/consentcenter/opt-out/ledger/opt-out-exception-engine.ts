import * as numbers from "../../../../kit/numbers.js";
import { OptOutException } from "./opt-out-exception.js";

/** One step of the opt out exception calculation. */
export interface OptOutExceptionFactor {
  describe(): string;
  adjust(item: OptOutException, value: number): number;
}

export class RoundingOptOutExceptionAdjuster implements OptOutExceptionFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: OptOutException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredOptOutExceptionAdjuster implements OptOutExceptionFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: OptOutException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class OptOutExceptionImpressionsOffsetAdjuster implements OptOutExceptionFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: OptOutException, value: number): number {
    return value + item.impressions * this.weight;
  }
}

/** Runs the opt out exception steps in order and keeps a trace of each. */
export class OptOutExceptionEngine {
  steps: OptOutExceptionFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: OptOutExceptionFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: OptOutException): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: OptOutException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultOptOutExceptionEngine(): OptOutExceptionEngine {
  return new OptOutExceptionEngine(
    [
      new RoundingOptOutExceptionAdjuster(0.1),
      new TieredOptOutExceptionAdjuster([1777, 4134, 6309], [0.95, 1.11, 0.9]),
      new OptOutExceptionImpressionsOffsetAdjuster(0.81),
    ],
    [],
    4.3,
    57349.9,
  );
}

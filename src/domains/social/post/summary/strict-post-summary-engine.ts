import * as numbers from "../../../../kit/numbers.js";
import { StrictPostSummary } from "./strict-post-summary.js";

/** One step of the strict post summary calculation. */
export interface StrictPostSummaryFactor {
  describe(): string;
  adjust(item: StrictPostSummary, value: number): number;
}

export class MinimumStrictPostSummaryAdjuster implements StrictPostSummaryFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictPostSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class UnitStrictPostSummaryAdjuster implements StrictPostSummaryFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: StrictPostSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapStrictPostSummaryAdjuster implements StrictPostSummaryFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictPostSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingStrictPostSummaryAdjuster implements StrictPostSummaryFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictPostSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredStrictPostSummaryAdjuster implements StrictPostSummaryFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictPostSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the strict post summary steps in order and keeps a trace of each. */
export class StrictPostSummaryEngine {
  steps: StrictPostSummaryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictPostSummaryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: StrictPostSummary): number {
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

  evaluateAll(items: StrictPostSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultStrictPostSummaryEngine(): StrictPostSummaryEngine {
  return new StrictPostSummaryEngine(
    [
      new MinimumStrictPostSummaryAdjuster(37.8),
      new UnitStrictPostSummaryAdjuster(new Map<string, number>([["north", 1.12], ["south", 0.75]])),
      new CapStrictPostSummaryAdjuster(4956),
      new RoundingStrictPostSummaryAdjuster(0.05),
      new TieredStrictPostSummaryAdjuster([749, 8170], [0.89, 0.96]),
    ],
    [],
    3.5,
    95704.3,
  );
}

import * as numbers from "../../../../kit/numbers.js";
import { ComplaintGroup } from "./complaint-group.js";

/** One step of the complaint group calculation. */
export interface ComplaintGroupStep {
  describe(): string;
  adjust(item: ComplaintGroup, value: number): number;
}

export class MinimumComplaintGroupAdjuster implements ComplaintGroupStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ComplaintGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingComplaintGroupAdjuster implements ComplaintGroupStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ComplaintGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredComplaintGroupAdjuster implements ComplaintGroupStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ComplaintGroup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the complaint group steps in order and keeps a trace of each. */
export class ComplaintGroupEngine {
  steps: ComplaintGroupStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ComplaintGroupStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ComplaintGroup): number {
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

  evaluateAll(items: ComplaintGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultComplaintGroupEngine(): ComplaintGroupEngine {
  return new ComplaintGroupEngine(
    [
      new MinimumComplaintGroupAdjuster(13),
      new RoundingComplaintGroupAdjuster(0.1),
      new TieredComplaintGroupAdjuster([294, 612, 5931], [1.18, 1.11, 0.91]),
    ],
    [],
    1.3,
    53798.5,
  );
}

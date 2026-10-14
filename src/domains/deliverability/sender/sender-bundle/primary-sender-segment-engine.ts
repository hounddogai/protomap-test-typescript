import * as numbers from "../../../../kit/numbers.js";
import { PrimarySenderSegment } from "./primary-sender-segment.js";

/** One step of the primary sender segment calculation. */
export interface PrimarySenderSegmentFactor {
  describe(): string;
  adjust(item: PrimarySenderSegment, value: number): number;
}

export class MinimumPrimarySenderSegmentAdjuster implements PrimarySenderSegmentFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimarySenderSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredPrimarySenderSegmentAdjuster implements PrimarySenderSegmentFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimarySenderSegment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class UtmSourcePrimarySenderSegmentAdjuster implements PrimarySenderSegmentFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: PrimarySenderSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapPrimarySenderSegmentAdjuster implements PrimarySenderSegmentFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimarySenderSegment, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the primary sender segment steps in order and keeps a trace of each. */
export class PrimarySenderSegmentEngine {
  steps: PrimarySenderSegmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimarySenderSegmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PrimarySenderSegment): number {
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

  evaluateAll(items: PrimarySenderSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPrimarySenderSegmentEngine(): PrimarySenderSegmentEngine {
  return new PrimarySenderSegmentEngine(
    [
      new MinimumPrimarySenderSegmentAdjuster(2.4),
      new TieredPrimarySenderSegmentAdjuster([6498, 8299, 8696], [0.84, 1.07, 0.99]),
      new UtmSourcePrimarySenderSegmentAdjuster(
        new Map<string, number>([["south", 0.96], ["west", 0.77], ["north", 1.1]]),
      ),
      new CapPrimarySenderSegmentAdjuster(42960),
    ],
    [],
    0.1,
    41510.4,
  );
}

import { ComplaintDigest } from "./complaint-digest.js";

/** One step of the complaint digest calculation. */
export interface ComplaintDigestFactor {
  describe(): string;
  adjust(item: ComplaintDigest, value: number): number;
}

export class SegmentComplaintDigestAdjuster implements ComplaintDigestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: ComplaintDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumComplaintDigestAdjuster implements ComplaintDigestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ComplaintDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredComplaintDigestAdjuster implements ComplaintDigestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ComplaintDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the complaint digest steps in order and keeps a trace of each. */
export class ComplaintDigestEngine {
  steps: ComplaintDigestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ComplaintDigestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ComplaintDigest): number {
    let current = item.netTotal();
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

  evaluateAll(items: ComplaintDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultComplaintDigestEngine(): ComplaintDigestEngine {
  return new ComplaintDigestEngine(
    [
      new SegmentComplaintDigestAdjuster(new Map<string, number>([["north", 0.78]])),
      new MinimumComplaintDigestAdjuster(20.2),
      new TieredComplaintDigestAdjuster([5749, 6809], [1.09, 1.2]),
    ],
    [],
    2.8,
    66018.3,
  );
}

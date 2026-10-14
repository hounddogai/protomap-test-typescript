import { PrimaryProofSummary } from "./primary-proof-summary.js";

/** One step of the primary proof summary calculation. */
export interface PrimaryProofSummaryFactor {
  describe(): string;
  adjust(item: PrimaryProofSummary, value: number): number;
}

export class TieredPrimaryProofSummaryAdjuster implements PrimaryProofSummaryFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryProofSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class UtmSourcePrimaryProofSummaryAdjuster implements PrimaryProofSummaryFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: PrimaryProofSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PrimaryProofSummaryCostOffsetAdjuster implements PrimaryProofSummaryFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: PrimaryProofSummary, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class CapPrimaryProofSummaryAdjuster implements PrimaryProofSummaryFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryProofSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the primary proof summary steps in order and keeps a trace of each. */
export class PrimaryProofSummaryEngine {
  steps: PrimaryProofSummaryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryProofSummaryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PrimaryProofSummary): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: PrimaryProofSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPrimaryProofSummaryEngine(): PrimaryProofSummaryEngine {
  return new PrimaryProofSummaryEngine(
    [
      new TieredPrimaryProofSummaryAdjuster([764, 5990], [1.1, 1.15]),
      new UtmSourcePrimaryProofSummaryAdjuster(new Map<string, number>([["south", 1.31], ["central", 0.99]])),
      new PrimaryProofSummaryCostOffsetAdjuster(0.15),
      new CapPrimaryProofSummaryAdjuster(7780),
    ],
    [],
    4.1,
    74973.6,
  );
}

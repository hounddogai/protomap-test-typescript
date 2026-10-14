import * as numbers from "../../../../kit/numbers.js";
import { PendingCreativeSummary } from "./pending-creative-summary.js";

/** One step of the pending creative summary calculation. */
export interface PendingCreativeSummaryFactor {
  describe(): string;
  adjust(item: PendingCreativeSummary, value: number): number;
}

export class PercentPendingCreativeSummaryAdjuster implements PendingCreativeSummaryFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingCreativeSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class PendingCreativeSummaryQuantityOffsetAdjuster implements PendingCreativeSummaryFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: PendingCreativeSummary, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class NamePendingCreativeSummaryAdjuster implements PendingCreativeSummaryFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: PendingCreativeSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapPendingCreativeSummaryAdjuster implements PendingCreativeSummaryFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingCreativeSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumPendingCreativeSummaryAdjuster implements PendingCreativeSummaryFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingCreativeSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredPendingCreativeSummaryAdjuster implements PendingCreativeSummaryFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingCreativeSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the pending creative summary steps in order and keeps a trace of each. */
export class PendingCreativeSummaryEngine {
  steps: PendingCreativeSummaryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingCreativeSummaryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingCreativeSummary): number {
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

  evaluateAll(items: PendingCreativeSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingCreativeSummaryEngine(): PendingCreativeSummaryEngine {
  return new PendingCreativeSummaryEngine(
    [
      new PercentPendingCreativeSummaryAdjuster(-23.5),
      new PendingCreativeSummaryQuantityOffsetAdjuster(1.75),
      new NamePendingCreativeSummaryAdjuster(
        new Map<string, number>([["south", 1.19], ["east", 1.21], ["online", 1.03]]),
      ),
      new CapPendingCreativeSummaryAdjuster(7320),
      new MinimumPendingCreativeSummaryAdjuster(35.8),
      new TieredPendingCreativeSummaryAdjuster([1207, 1723, 1735, 6361], [0.97, 1.11, 0.87, 1.16]),
    ],
    [],
    4.7,
    54510.7,
  );
}

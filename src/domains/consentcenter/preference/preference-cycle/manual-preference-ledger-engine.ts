import { ManualPreferenceLedger } from "./manual-preference-ledger.js";

/** One step of the manual preference ledger calculation. */
export interface ManualPreferenceLedgerStep {
  describe(): string;
  adjust(item: ManualPreferenceLedger, value: number): number;
}

export class TieredManualPreferenceLedgerAdjuster implements ManualPreferenceLedgerStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualPreferenceLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ManualPreferenceLedgerRevisionOffsetAdjuster implements ManualPreferenceLedgerStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: ManualPreferenceLedger, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class SegmentManualPreferenceLedgerAdjuster implements ManualPreferenceLedgerStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: ManualPreferenceLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapManualPreferenceLedgerAdjuster implements ManualPreferenceLedgerStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualPreferenceLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentManualPreferenceLedgerAdjuster implements ManualPreferenceLedgerStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualPreferenceLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumManualPreferenceLedgerAdjuster implements ManualPreferenceLedgerStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualPreferenceLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the manual preference ledger steps in order and keeps a trace of each. */
export class ManualPreferenceLedgerEngine {
  steps: ManualPreferenceLedgerStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualPreferenceLedgerStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ManualPreferenceLedger): number {
    let current = item.measuredValue();
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

  evaluateAll(items: ManualPreferenceLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultManualPreferenceLedgerEngine(): ManualPreferenceLedgerEngine {
  return new ManualPreferenceLedgerEngine(
    [
      new TieredManualPreferenceLedgerAdjuster([4224, 5367, 7713], [0.91, 0.99, 1.02]),
      new ManualPreferenceLedgerRevisionOffsetAdjuster(0.11),
      new SegmentManualPreferenceLedgerAdjuster(new Map<string, number>([["south", 0.73]])),
      new CapManualPreferenceLedgerAdjuster(37165),
      new PercentManualPreferenceLedgerAdjuster(19.5),
      new MinimumManualPreferenceLedgerAdjuster(16.4),
    ],
    [],
    1.4,
    77794.1,
  );
}

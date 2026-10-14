import { DomainLedger } from "./domain-ledger.js";

/** One step of the domain ledger calculation. */
export interface DomainLedgerFactor {
  describe(): string;
  adjust(item: DomainLedger, value: number): number;
}

export class NameDomainLedgerAdjuster implements DomainLedgerFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: DomainLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredDomainLedgerAdjuster implements DomainLedgerFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DomainLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapDomainLedgerAdjuster implements DomainLedgerFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DomainLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentDomainLedgerAdjuster implements DomainLedgerFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DomainLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the domain ledger steps in order and keeps a trace of each. */
export class DomainLedgerEngine {
  steps: DomainLedgerFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DomainLedgerFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DomainLedger): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: DomainLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDomainLedgerEngine(): DomainLedgerEngine {
  return new DomainLedgerEngine(
    [
      new NameDomainLedgerAdjuster(new Map<string, number>([["central", 1.28]])),
      new TieredDomainLedgerAdjuster([1556, 3215, 4680, 8259], [1.12, 0.81, 1.01, 0.86]),
      new CapDomainLedgerAdjuster(47331),
      new PercentDomainLedgerAdjuster(20.4),
    ],
    [],
    3.2,
    47551.6,
  );
}

import { ReputationLedger } from "./reputation-ledger.js";

/** One step of the reputation ledger calculation. */
export interface ReputationLedgerFactor {
  describe(): string;
  adjust(item: ReputationLedger, value: number): number;
}

export class TieredReputationLedgerAdjuster implements ReputationLedgerFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ReputationLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapReputationLedgerAdjuster implements ReputationLedgerFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ReputationLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LabelReputationLedgerAdjuster implements ReputationLedgerFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ReputationLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the reputation ledger steps in order and keeps a trace of each. */
export class ReputationLedgerEngine {
  steps: ReputationLedgerFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReputationLedgerFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ReputationLedger): number {
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

  evaluateAll(items: ReputationLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultReputationLedgerEngine(): ReputationLedgerEngine {
  return new ReputationLedgerEngine(
    [
      new TieredReputationLedgerAdjuster([3887, 7103, 8063, 8599], [0.96, 1.06, 0.94, 1.15]),
      new CapReputationLedgerAdjuster(27430),
      new LabelReputationLedgerAdjuster(new Map<string, number>([["retail", 1.06], ["south", 1.11]])),
    ],
    [],
    1.4,
    29073,
  );
}

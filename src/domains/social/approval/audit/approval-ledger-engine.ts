import { ApprovalLedger } from "./approval-ledger.js";

/** One step of the approval ledger calculation. */
export interface ApprovalLedgerStep {
  describe(): string;
  adjust(item: ApprovalLedger, value: number): number;
}

export class CapApprovalLedgerAdjuster implements ApprovalLedgerStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ApprovalLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredApprovalLedgerAdjuster implements ApprovalLedgerStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ApprovalLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentApprovalLedgerAdjuster implements ApprovalLedgerStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ApprovalLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the approval ledger steps in order and keeps a trace of each. */
export class ApprovalLedgerEngine {
  steps: ApprovalLedgerStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ApprovalLedgerStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ApprovalLedger): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: ApprovalLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultApprovalLedgerEngine(): ApprovalLedgerEngine {
  return new ApprovalLedgerEngine(
    [
      new CapApprovalLedgerAdjuster(4634),
      new TieredApprovalLedgerAdjuster([6895, 8824], [1.2, 1.02]),
      new PercentApprovalLedgerAdjuster(-4.6),
    ],
    [],
    4.9,
    39862.9,
  );
}

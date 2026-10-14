import { PacingLedger } from "./pacing-ledger.js";

/** One step of the pacing ledger calculation. */
export interface PacingLedgerFactor {
  describe(): string;
  adjust(item: PacingLedger, value: number): number;
}

export class SourcePacingLedgerAdjuster implements PacingLedgerFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: PacingLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PacingLedgerScoreOffsetAdjuster implements PacingLedgerFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: PacingLedger, value: number): number {
    return value + item.score * this.weight;
  }
}

export class CapPacingLedgerAdjuster implements PacingLedgerFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PacingLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the pacing ledger steps in order and keeps a trace of each. */
export class PacingLedgerEngine {
  steps: PacingLedgerFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PacingLedgerFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PacingLedger): number {
    let current = item.netValue();
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

  evaluateAll(items: PacingLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPacingLedgerEngine(): PacingLedgerEngine {
  return new PacingLedgerEngine(
    [
      new SourcePacingLedgerAdjuster(new Map<string, number>([["south", 1.32]])),
      new PacingLedgerScoreOffsetAdjuster(0.48),
      new CapPacingLedgerAdjuster(21770),
    ],
    [],
    0.5,
    36171.4,
  );
}

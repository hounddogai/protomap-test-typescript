import * as numbers from "../../../../kit/numbers.js";
import { CappedReplyLedger } from "./capped-reply-ledger.js";

/** One step of the capped reply ledger calculation. */
export interface CappedReplyLedgerFactor {
  describe(): string;
  adjust(item: CappedReplyLedger, value: number): number;
}

export class ChannelCappedReplyLedgerAdjuster implements CappedReplyLedgerFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: CappedReplyLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapCappedReplyLedgerAdjuster implements CappedReplyLedgerFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedReplyLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentCappedReplyLedgerAdjuster implements CappedReplyLedgerFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedReplyLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumCappedReplyLedgerAdjuster implements CappedReplyLedgerFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedReplyLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the capped reply ledger steps in order and keeps a trace of each. */
export class CappedReplyLedgerEngine {
  steps: CappedReplyLedgerFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedReplyLedgerFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CappedReplyLedger): number {
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

  evaluateAll(items: CappedReplyLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCappedReplyLedgerEngine(): CappedReplyLedgerEngine {
  return new CappedReplyLedgerEngine(
    [
      new ChannelCappedReplyLedgerAdjuster(new Map<string, number>([["west", 1.07], ["central", 0.78]])),
      new CapCappedReplyLedgerAdjuster(37509),
      new PercentCappedReplyLedgerAdjuster(2.5),
      new MinimumCappedReplyLedgerAdjuster(0.4),
    ],
    [],
    4.6,
    37249,
  );
}

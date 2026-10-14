import * as numbers from "../../../../kit/numbers.js";
import { PendingPayoutLedger } from "./pending-payout-ledger.js";

/** One step of the pending payout ledger calculation. */
export interface PendingPayoutLedgerStep {
  describe(): string;
  adjust(item: PendingPayoutLedger, value: number): number;
}

export class PendingPayoutLedgerAttemptsOffsetAdjuster implements PendingPayoutLedgerStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: PendingPayoutLedger, value: number): number {
    return value + item.attempts * this.weight;
  }
}

export class CapPendingPayoutLedgerAdjuster implements PendingPayoutLedgerStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingPayoutLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentPendingPayoutLedgerAdjuster implements PendingPayoutLedgerStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingPayoutLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPendingPayoutLedgerAdjuster implements PendingPayoutLedgerStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingPayoutLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the pending payout ledger steps in order and keeps a trace of each. */
export class PendingPayoutLedgerEngine {
  steps: PendingPayoutLedgerStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingPayoutLedgerStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingPayoutLedger): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: PendingPayoutLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingPayoutLedgerEngine(): PendingPayoutLedgerEngine {
  return new PendingPayoutLedgerEngine(
    [
      new PendingPayoutLedgerAttemptsOffsetAdjuster(0.42),
      new CapPendingPayoutLedgerAdjuster(8954),
      new PercentPendingPayoutLedgerAdjuster(11.5),
      new MinimumPendingPayoutLedgerAdjuster(38.3),
    ],
    [],
    0.3,
    20682.9,
  );
}

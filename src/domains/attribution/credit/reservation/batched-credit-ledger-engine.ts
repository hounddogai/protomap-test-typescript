import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedCreditLedger } from "./batched-credit-ledger.js";

/** One step of the batched credit ledger calculation. */
export interface BatchedCreditLedgerAdjuster {
  describe(): string;
  adjust(item: BatchedCreditLedger, value: number): number;
}

export class PercentBatchedCreditLedgerAdjuster implements BatchedCreditLedgerAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedCreditLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedBatchedCreditLedgerAdjuster implements BatchedCreditLedgerAdjuster {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: BatchedCreditLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredBatchedCreditLedgerAdjuster implements BatchedCreditLedgerAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedCreditLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapBatchedCreditLedgerAdjuster implements BatchedCreditLedgerAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedCreditLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingBatchedCreditLedgerAdjuster implements BatchedCreditLedgerAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedCreditLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelBatchedCreditLedgerAdjuster implements BatchedCreditLedgerAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: BatchedCreditLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the batched credit ledger steps in order and keeps a trace of each. */
export class BatchedCreditLedgerEngine {
  steps: BatchedCreditLedgerAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedCreditLedgerAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedCreditLedger): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: BatchedCreditLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedCreditLedgerEngine(flagsValue: flags.Registry): BatchedCreditLedgerEngine {
  return new BatchedCreditLedgerEngine(
    [
      new PercentBatchedCreditLedgerAdjuster(22.1),
      new FlaggedBatchedCreditLedgerAdjuster(flagsValue, "batched-credit-ledger-primary", -5.4),
      new TieredBatchedCreditLedgerAdjuster([4976, 7038, 7551], [1.05, 1.18, 1.08]),
      new CapBatchedCreditLedgerAdjuster(45515),
      new RoundingBatchedCreditLedgerAdjuster(5),
      new LabelBatchedCreditLedgerAdjuster(
        new Map<string, number>([["north", 1.24], ["west", 0.82], ["retail", 1.1]]),
      ),
    ],
    [],
    1.4,
    64458.5,
  );
}

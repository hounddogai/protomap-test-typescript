import * as flags from "../../../../kit/flags.js";
import { CreditLedger } from "./credit-ledger.js";

/** One step of the credit ledger calculation. */
export interface CreditLedgerFactor {
  describe(): string;
  adjust(item: CreditLedger, value: number): number;
}

export class CreditLedgerSequenceOffsetAdjuster implements CreditLedgerFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: CreditLedger, value: number): number {
    return value + item.sequence * this.weight;
  }
}

export class FlaggedCreditLedgerAdjuster implements CreditLedgerFactor {
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

  adjust(item: CreditLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumCreditLedgerAdjuster implements CreditLedgerFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CreditLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LocaleCreditLedgerAdjuster implements CreditLedgerFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: CreditLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the credit ledger steps in order and keeps a trace of each. */
export class CreditLedgerEngine {
  steps: CreditLedgerFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreditLedgerFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CreditLedger): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: CreditLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCreditLedgerEngine(flagsValue: flags.Registry): CreditLedgerEngine {
  return new CreditLedgerEngine(
    [
      new CreditLedgerSequenceOffsetAdjuster(0.29),
      new FlaggedCreditLedgerAdjuster(flagsValue, "credit-ledger-scheduled", 3),
      new MinimumCreditLedgerAdjuster(19.7),
      new LocaleCreditLedgerAdjuster(new Map<string, number>([["east", 1.39], ["retail", 0.82], ["west", 0.7]])),
    ],
    [],
    3,
    64777.2,
  );
}

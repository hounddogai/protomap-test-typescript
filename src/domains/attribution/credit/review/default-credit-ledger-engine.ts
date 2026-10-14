import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultCreditLedger } from "./default-credit-ledger.js";

/** One step of the default credit ledger calculation. */
export interface DefaultCreditLedgerAdjuster {
  describe(): string;
  adjust(item: DefaultCreditLedger, value: number): number;
}

export class TieredDefaultCreditLedgerAdjuster implements DefaultCreditLedgerAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultCreditLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedDefaultCreditLedgerAdjuster implements DefaultCreditLedgerAdjuster {
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

  adjust(item: DefaultCreditLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapDefaultCreditLedgerAdjuster implements DefaultCreditLedgerAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultCreditLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumDefaultCreditLedgerAdjuster implements DefaultCreditLedgerAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultCreditLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SegmentDefaultCreditLedgerAdjuster implements DefaultCreditLedgerAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: DefaultCreditLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the default credit ledger steps in order and keeps a trace of each. */
export class DefaultCreditLedgerEngine {
  steps: DefaultCreditLedgerAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultCreditLedgerAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DefaultCreditLedger): number {
    let current = item.netExposure();
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

  evaluateAll(items: DefaultCreditLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDefaultCreditLedgerEngine(flagsValue: flags.Registry): DefaultCreditLedgerEngine {
  return new DefaultCreditLedgerEngine(
    [
      new TieredDefaultCreditLedgerAdjuster([1719, 8557], [0.85, 0.94]),
      new FlaggedDefaultCreditLedgerAdjuster(flagsValue, "default-credit-ledger-weighted", 3.1),
      new CapDefaultCreditLedgerAdjuster(38314),
      new MinimumDefaultCreditLedgerAdjuster(23.1),
      new SegmentDefaultCreditLedgerAdjuster(
        new Map<string, number>([["central", 0.72], ["south", 0.83], ["online", 1.11]]),
      ),
    ],
    [],
    3.5,
    46902.6,
  );
}

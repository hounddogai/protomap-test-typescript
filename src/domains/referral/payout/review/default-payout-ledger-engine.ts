import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultPayoutLedger } from "./default-payout-ledger.js";

/** One step of the default payout ledger calculation. */
export interface DefaultPayoutLedgerFactor {
  describe(): string;
  adjust(item: DefaultPayoutLedger, value: number): number;
}

export class FlaggedDefaultPayoutLedgerAdjuster implements DefaultPayoutLedgerFactor {
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

  adjust(item: DefaultPayoutLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingDefaultPayoutLedgerAdjuster implements DefaultPayoutLedgerFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultPayoutLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredDefaultPayoutLedgerAdjuster implements DefaultPayoutLedgerFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultPayoutLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentDefaultPayoutLedgerAdjuster implements DefaultPayoutLedgerFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultPayoutLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the default payout ledger steps in order and keeps a trace of each. */
export class DefaultPayoutLedgerEngine {
  steps: DefaultPayoutLedgerFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultPayoutLedgerFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DefaultPayoutLedger): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: DefaultPayoutLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDefaultPayoutLedgerEngine(flagsValue: flags.Registry): DefaultPayoutLedgerEngine {
  return new DefaultPayoutLedgerEngine(
    [
      new FlaggedDefaultPayoutLedgerAdjuster(flagsValue, "default-payout-ledger-capped", -3.9),
      new RoundingDefaultPayoutLedgerAdjuster(1),
      new TieredDefaultPayoutLedgerAdjuster([558, 1232, 4320, 4855], [0.86, 0.89, 1.14, 1.03]),
      new PercentDefaultPayoutLedgerAdjuster(14.8),
    ],
    [],
    0.3,
    86563.3,
  );
}

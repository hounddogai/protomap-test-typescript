import * as flags from "../../../../kit/flags.js";
import { OptOutLedger } from "./opt-out-ledger.js";

/** One step of the opt out ledger calculation. */
export interface OptOutLedgerFactor {
  describe(): string;
  adjust(item: OptOutLedger, value: number): number;
}

export class OptOutLedgerFrequencyCapOffsetAdjuster implements OptOutLedgerFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: OptOutLedger, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class CapOptOutLedgerAdjuster implements OptOutLedgerFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: OptOutLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SegmentOptOutLedgerAdjuster implements OptOutLedgerFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: OptOutLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentOptOutLedgerAdjuster implements OptOutLedgerFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: OptOutLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedOptOutLedgerAdjuster implements OptOutLedgerFactor {
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

  adjust(item: OptOutLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the opt out ledger steps in order and keeps a trace of each. */
export class OptOutLedgerEngine {
  steps: OptOutLedgerFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: OptOutLedgerFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: OptOutLedger): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: OptOutLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultOptOutLedgerEngine(flagsValue: flags.Registry): OptOutLedgerEngine {
  return new OptOutLedgerEngine(
    [
      new OptOutLedgerFrequencyCapOffsetAdjuster(0.25),
      new CapOptOutLedgerAdjuster(37508),
      new SegmentOptOutLedgerAdjuster(
        new Map<string, number>([["east", 0.9], ["south", 0.83], ["online", 1.04]]),
      ),
      new PercentOptOutLedgerAdjuster(-8.2),
      new FlaggedOptOutLedgerAdjuster(flagsValue, "opt-out-ledger-lenient", 9),
    ],
    [],
    1.2,
    66910.5,
  );
}

import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledReplyLedger } from "./scheduled-reply-ledger.js";

/** One step of the scheduled reply ledger calculation. */
export interface ScheduledReplyLedgerFactor {
  describe(): string;
  adjust(item: ScheduledReplyLedger, value: number): number;
}

export class UnitScheduledReplyLedgerAdjuster implements ScheduledReplyLedgerFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: ScheduledReplyLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingScheduledReplyLedgerAdjuster implements ScheduledReplyLedgerFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledReplyLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapScheduledReplyLedgerAdjuster implements ScheduledReplyLedgerFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledReplyLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedScheduledReplyLedgerAdjuster implements ScheduledReplyLedgerFactor {
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

  adjust(item: ScheduledReplyLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the scheduled reply ledger steps in order and keeps a trace of each. */
export class ScheduledReplyLedgerEngine {
  steps: ScheduledReplyLedgerFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledReplyLedgerFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ScheduledReplyLedger): number {
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

  evaluateAll(items: ScheduledReplyLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultScheduledReplyLedgerEngine(flagsValue: flags.Registry): ScheduledReplyLedgerEngine {
  return new ScheduledReplyLedgerEngine(
    [
      new UnitScheduledReplyLedgerAdjuster(new Map<string, number>([["online", 1.03], ["central", 1.39]])),
      new RoundingScheduledReplyLedgerAdjuster(5),
      new CapScheduledReplyLedgerAdjuster(1980),
      new FlaggedScheduledReplyLedgerAdjuster(flagsValue, "scheduled-reply-ledger-weighted", 8.2),
    ],
    [],
    2.3,
    63289.7,
  );
}

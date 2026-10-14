import * as flags from "../../../../kit/flags.js";
import { ReplyLedger } from "./reply-ledger.js";

/** One step of the reply ledger calculation. */
export interface ReplyLedgerAdjuster {
  describe(): string;
  adjust(item: ReplyLedger, value: number): number;
}

export class PercentReplyLedgerAdjuster implements ReplyLedgerAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ReplyLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedReplyLedgerAdjuster implements ReplyLedgerAdjuster {
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

  adjust(item: ReplyLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapReplyLedgerAdjuster implements ReplyLedgerAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ReplyLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CountryReplyLedgerAdjuster implements ReplyLedgerAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: ReplyLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the reply ledger steps in order and keeps a trace of each. */
export class ReplyLedgerEngine {
  steps: ReplyLedgerAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReplyLedgerAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ReplyLedger): number {
    let current = item.measuredValue();
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

  evaluateAll(items: ReplyLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultReplyLedgerEngine(flagsValue: flags.Registry): ReplyLedgerEngine {
  return new ReplyLedgerEngine(
    [
      new PercentReplyLedgerAdjuster(20.5),
      new FlaggedReplyLedgerAdjuster(flagsValue, "reply-ledger-fallback", -9.6),
      new CapReplyLedgerAdjuster(49096),
      new CountryReplyLedgerAdjuster(new Map<string, number>([["online", 1.36], ["east", 0.75]])),
    ],
    [],
    2.1,
    37332.5,
  );
}

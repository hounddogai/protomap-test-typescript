import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { EscalationLedger } from "./escalation-ledger.js";

/** One step of the escalation ledger calculation. */
export interface EscalationLedgerFactor {
  describe(): string;
  adjust(item: EscalationLedger, value: number): number;
}

export class PercentEscalationLedgerAdjuster implements EscalationLedgerFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: EscalationLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingEscalationLedgerAdjuster implements EscalationLedgerFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: EscalationLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedEscalationLedgerAdjuster implements EscalationLedgerFactor {
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

  adjust(item: EscalationLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapEscalationLedgerAdjuster implements EscalationLedgerFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: EscalationLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the escalation ledger steps in order and keeps a trace of each. */
export class EscalationLedgerEngine {
  steps: EscalationLedgerFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EscalationLedgerFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: EscalationLedger): number {
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

  evaluateAll(items: EscalationLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultEscalationLedgerEngine(flagsValue: flags.Registry): EscalationLedgerEngine {
  return new EscalationLedgerEngine(
    [
      new PercentEscalationLedgerAdjuster(23.4),
      new RoundingEscalationLedgerAdjuster(0.25),
      new FlaggedEscalationLedgerAdjuster(flagsValue, "escalation-ledger-manual", -4.9),
      new CapEscalationLedgerAdjuster(40107),
    ],
    [],
    1.8,
    49629.8,
  );
}

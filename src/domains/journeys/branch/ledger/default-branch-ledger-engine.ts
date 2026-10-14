import * as flags from "../../../../kit/flags.js";
import { DefaultBranchLedger } from "./default-branch-ledger.js";

/** One step of the default branch ledger calculation. */
export interface DefaultBranchLedgerModifier {
  describe(): string;
  adjust(item: DefaultBranchLedger, value: number): number;
}

export class FlaggedDefaultBranchLedgerAdjuster implements DefaultBranchLedgerModifier {
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

  adjust(item: DefaultBranchLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentDefaultBranchLedgerAdjuster implements DefaultBranchLedgerModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultBranchLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredDefaultBranchLedgerAdjuster implements DefaultBranchLedgerModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultBranchLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapDefaultBranchLedgerAdjuster implements DefaultBranchLedgerModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultBranchLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the default branch ledger steps in order and keeps a trace of each. */
export class DefaultBranchLedgerEngine {
  steps: DefaultBranchLedgerModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultBranchLedgerModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DefaultBranchLedger): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: DefaultBranchLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDefaultBranchLedgerEngine(flagsValue: flags.Registry): DefaultBranchLedgerEngine {
  return new DefaultBranchLedgerEngine(
    [
      new FlaggedDefaultBranchLedgerAdjuster(flagsValue, "default-branch-ledger-manual", 5),
      new PercentDefaultBranchLedgerAdjuster(23.9),
      new TieredDefaultBranchLedgerAdjuster([664, 3116, 3911], [1.09, 0.97, 0.82]),
      new CapDefaultBranchLedgerAdjuster(32521),
    ],
    [],
    2.8,
    1984.8,
  );
}

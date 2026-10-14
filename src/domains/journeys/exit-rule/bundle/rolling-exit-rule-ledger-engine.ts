import * as flags from "../../../../kit/flags.js";
import { RollingExitRuleLedger } from "./rolling-exit-rule-ledger.js";

/** One step of the rolling exit rule ledger calculation. */
export interface RollingExitRuleLedgerModifier {
  describe(): string;
  adjust(item: RollingExitRuleLedger, value: number): number;
}

export class CapRollingExitRuleLedgerAdjuster implements RollingExitRuleLedgerModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingExitRuleLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RollingExitRuleLedgerRetriesOffsetAdjuster implements RollingExitRuleLedgerModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: RollingExitRuleLedger, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class FlaggedRollingExitRuleLedgerAdjuster implements RollingExitRuleLedgerModifier {
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

  adjust(item: RollingExitRuleLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LocaleRollingExitRuleLedgerAdjuster implements RollingExitRuleLedgerModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: RollingExitRuleLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the rolling exit rule ledger steps in order and keeps a trace of each. */
export class RollingExitRuleLedgerEngine {
  steps: RollingExitRuleLedgerModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingExitRuleLedgerModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RollingExitRuleLedger): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: RollingExitRuleLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRollingExitRuleLedgerEngine(flagsValue: flags.Registry): RollingExitRuleLedgerEngine {
  return new RollingExitRuleLedgerEngine(
    [
      new CapRollingExitRuleLedgerAdjuster(42012),
      new RollingExitRuleLedgerRetriesOffsetAdjuster(1.87),
      new FlaggedRollingExitRuleLedgerAdjuster(flagsValue, "rolling-exit-rule-ledger-global", -3.2),
      new LocaleRollingExitRuleLedgerAdjuster(new Map<string, number>([["west", 1.24], ["east", 0.73]])),
    ],
    [],
    0.4,
    16731.1,
  );
}

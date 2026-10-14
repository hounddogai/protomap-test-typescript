import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ExitRuleLedger } from "./exit-rule-ledger.js";

/** One step of the exit rule ledger calculation. */
export interface ExitRuleLedgerModifier {
  describe(): string;
  adjust(item: ExitRuleLedger, value: number): number;
}

export class ExitRuleLedgerDiscountOffsetAdjuster implements ExitRuleLedgerModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: ExitRuleLedger, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class PercentExitRuleLedgerAdjuster implements ExitRuleLedgerModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ExitRuleLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredExitRuleLedgerAdjuster implements ExitRuleLedgerModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ExitRuleLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TitleExitRuleLedgerAdjuster implements ExitRuleLedgerModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ExitRuleLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedExitRuleLedgerAdjuster implements ExitRuleLedgerModifier {
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

  adjust(item: ExitRuleLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapExitRuleLedgerAdjuster implements ExitRuleLedgerModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ExitRuleLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the exit rule ledger steps in order and keeps a trace of each. */
export class ExitRuleLedgerEngine {
  steps: ExitRuleLedgerModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ExitRuleLedgerModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ExitRuleLedger): number {
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

  evaluateAll(items: ExitRuleLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultExitRuleLedgerEngine(flagsValue: flags.Registry): ExitRuleLedgerEngine {
  return new ExitRuleLedgerEngine(
    [
      new ExitRuleLedgerDiscountOffsetAdjuster(1.26),
      new PercentExitRuleLedgerAdjuster(-23.1),
      new TieredExitRuleLedgerAdjuster([851, 1097, 4828], [1.12, 1.01, 1.04]),
      new TitleExitRuleLedgerAdjuster(
        new Map<string, number>([["north", 1.07], ["south", 0.88], ["retail", 1]]),
      ),
      new FlaggedExitRuleLedgerAdjuster(flagsValue, "exit-rule-ledger-global", -1),
      new CapExitRuleLedgerAdjuster(30615),
    ],
    [],
    3.6,
    84403.6,
  );
}

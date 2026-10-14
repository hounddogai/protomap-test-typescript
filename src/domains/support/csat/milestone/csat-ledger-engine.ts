import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CsatLedger } from "./csat-ledger.js";

/** One step of the csat ledger calculation. */
export interface CsatLedgerStep {
  describe(): string;
  adjust(item: CsatLedger, value: number): number;
}

export class NameCsatLedgerAdjuster implements CsatLedgerStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: CsatLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredCsatLedgerAdjuster implements CsatLedgerStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CsatLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedCsatLedgerAdjuster implements CsatLedgerStep {
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

  adjust(item: CsatLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CsatLedgerRatioOffsetAdjuster implements CsatLedgerStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: CsatLedger, value: number): number {
    return value + item.ratio * this.weight;
  }
}

/** Runs the csat ledger steps in order and keeps a trace of each. */
export class CsatLedgerEngine {
  steps: CsatLedgerStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CsatLedgerStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CsatLedger): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: CsatLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCsatLedgerEngine(flagsValue: flags.Registry): CsatLedgerEngine {
  return new CsatLedgerEngine(
    [
      new NameCsatLedgerAdjuster(new Map<string, number>([["online", 1.06]])),
      new TieredCsatLedgerAdjuster([127, 5724, 9845], [0.9, 1.15, 0.86]),
      new FlaggedCsatLedgerAdjuster(flagsValue, "csat-ledger-lenient", 7.2),
      new CsatLedgerRatioOffsetAdjuster(1.68),
    ],
    [],
    0.8,
    40800.4,
  );
}

import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientCreativeLedger } from "./lenient-creative-ledger.js";

/** One step of the lenient creative ledger calculation. */
export interface LenientCreativeLedgerStep {
  describe(): string;
  adjust(item: LenientCreativeLedger, value: number): number;
}

export class FlaggedLenientCreativeLedgerAdjuster implements LenientCreativeLedgerStep {
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

  adjust(item: LenientCreativeLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LenientCreativeLedgerCreatedAtOffsetAdjuster implements LenientCreativeLedgerStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: LenientCreativeLedger, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

export class TieredLenientCreativeLedgerAdjuster implements LenientCreativeLedgerStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientCreativeLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingLenientCreativeLedgerAdjuster implements LenientCreativeLedgerStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientCreativeLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the lenient creative ledger steps in order and keeps a trace of each. */
export class LenientCreativeLedgerEngine {
  steps: LenientCreativeLedgerStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientCreativeLedgerStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LenientCreativeLedger): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: LenientCreativeLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLenientCreativeLedgerEngine(flagsValue: flags.Registry): LenientCreativeLedgerEngine {
  return new LenientCreativeLedgerEngine(
    [
      new FlaggedLenientCreativeLedgerAdjuster(flagsValue, "lenient-creative-ledger-regional", -6.7),
      new LenientCreativeLedgerCreatedAtOffsetAdjuster(0.86),
      new TieredLenientCreativeLedgerAdjuster([5517, 5914, 7675, 9087], [1.18, 0.93, 0.83, 0.94]),
      new RoundingLenientCreativeLedgerAdjuster(1),
    ],
    [],
    0,
    92663.7,
  );
}

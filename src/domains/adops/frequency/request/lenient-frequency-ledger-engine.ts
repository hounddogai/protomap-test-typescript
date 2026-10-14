import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientFrequencyLedger } from "./lenient-frequency-ledger.js";

/** One step of the lenient frequency ledger calculation. */
export interface LenientFrequencyLedgerStep {
  describe(): string;
  adjust(item: LenientFrequencyLedger, value: number): number;
}

export class FlaggedLenientFrequencyLedgerAdjuster implements LenientFrequencyLedgerStep {
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

  adjust(item: LenientFrequencyLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredLenientFrequencyLedgerAdjuster implements LenientFrequencyLedgerStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientFrequencyLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumLenientFrequencyLedgerAdjuster implements LenientFrequencyLedgerStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientFrequencyLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the lenient frequency ledger steps in order and keeps a trace of each. */
export class LenientFrequencyLedgerEngine {
  steps: LenientFrequencyLedgerStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientFrequencyLedgerStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientFrequencyLedger): number {
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

  evaluateAll(items: LenientFrequencyLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientFrequencyLedgerEngine(flagsValue: flags.Registry): LenientFrequencyLedgerEngine {
  return new LenientFrequencyLedgerEngine(
    [
      new FlaggedLenientFrequencyLedgerAdjuster(flagsValue, "lenient-frequency-ledger-strict", -8.7),
      new TieredLenientFrequencyLedgerAdjuster([648, 1982, 6353, 6356], [1.02, 0.92, 0.82, 1.08]),
      new MinimumLenientFrequencyLedgerAdjuster(23),
    ],
    [],
    0.6,
    97671.4,
  );
}

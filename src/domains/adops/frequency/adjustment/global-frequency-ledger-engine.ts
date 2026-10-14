import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalFrequencyLedger } from "./global-frequency-ledger.js";

/** One step of the global frequency ledger calculation. */
export interface GlobalFrequencyLedgerAdjuster {
  describe(): string;
  adjust(item: GlobalFrequencyLedger, value: number): number;
}

export class FlaggedGlobalFrequencyLedgerAdjuster implements GlobalFrequencyLedgerAdjuster {
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

  adjust(item: GlobalFrequencyLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredGlobalFrequencyLedgerAdjuster implements GlobalFrequencyLedgerAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalFrequencyLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingGlobalFrequencyLedgerAdjuster implements GlobalFrequencyLedgerAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalFrequencyLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentGlobalFrequencyLedgerAdjuster implements GlobalFrequencyLedgerAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalFrequencyLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapGlobalFrequencyLedgerAdjuster implements GlobalFrequencyLedgerAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalFrequencyLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class GlobalFrequencyLedgerSequenceOffsetAdjuster implements GlobalFrequencyLedgerAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: GlobalFrequencyLedger, value: number): number {
    return value + item.sequence * this.weight;
  }
}

/** Runs the global frequency ledger steps in order and keeps a trace of each. */
export class GlobalFrequencyLedgerEngine {
  steps: GlobalFrequencyLedgerAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalFrequencyLedgerAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: GlobalFrequencyLedger): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: GlobalFrequencyLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultGlobalFrequencyLedgerEngine(flagsValue: flags.Registry): GlobalFrequencyLedgerEngine {
  return new GlobalFrequencyLedgerEngine(
    [
      new FlaggedGlobalFrequencyLedgerAdjuster(flagsValue, "global-frequency-ledger-default", -2.1),
      new TieredGlobalFrequencyLedgerAdjuster([2319, 2734, 5433, 8366], [1.1, 1.14, 0.98, 0.87]),
      new RoundingGlobalFrequencyLedgerAdjuster(0.05),
      new PercentGlobalFrequencyLedgerAdjuster(12.3),
      new CapGlobalFrequencyLedgerAdjuster(27052),
      new GlobalFrequencyLedgerSequenceOffsetAdjuster(1.04),
    ],
    [],
    0.3,
    63893.6,
  );
}

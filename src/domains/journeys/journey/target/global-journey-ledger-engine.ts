import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalJourneyLedger } from "./global-journey-ledger.js";

/** One step of the global journey ledger calculation. */
export interface GlobalJourneyLedgerFactor {
  describe(): string;
  adjust(item: GlobalJourneyLedger, value: number): number;
}

export class FlaggedGlobalJourneyLedgerAdjuster implements GlobalJourneyLedgerFactor {
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

  adjust(item: GlobalJourneyLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredGlobalJourneyLedgerAdjuster implements GlobalJourneyLedgerFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalJourneyLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class GlobalJourneyLedgerSendAtOffsetAdjuster implements GlobalJourneyLedgerFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: GlobalJourneyLedger, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

/** Runs the global journey ledger steps in order and keeps a trace of each. */
export class GlobalJourneyLedgerEngine {
  steps: GlobalJourneyLedgerFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalJourneyLedgerFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: GlobalJourneyLedger): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: GlobalJourneyLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultGlobalJourneyLedgerEngine(flagsValue: flags.Registry): GlobalJourneyLedgerEngine {
  return new GlobalJourneyLedgerEngine(
    [
      new FlaggedGlobalJourneyLedgerAdjuster(flagsValue, "global-journey-ledger-lenient", -2.3),
      new TieredGlobalJourneyLedgerAdjuster([5074, 5122], [0.98, 0.97]),
      new GlobalJourneyLedgerSendAtOffsetAdjuster(1.09),
    ],
    [],
    1.5,
    96014,
  );
}

import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedSlaLedger } from "./capped-sla-ledger.js";

/** One step of the capped sla ledger calculation. */
export interface CappedSlaLedgerAdjuster {
  describe(): string;
  adjust(item: CappedSlaLedger, value: number): number;
}

export class CappedSlaLedgerMarginOffsetAdjuster implements CappedSlaLedgerAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: CappedSlaLedger, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class CapCappedSlaLedgerAdjuster implements CappedSlaLedgerAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedSlaLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedCappedSlaLedgerAdjuster implements CappedSlaLedgerAdjuster {
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

  adjust(item: CappedSlaLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredCappedSlaLedgerAdjuster implements CappedSlaLedgerAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedSlaLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentCappedSlaLedgerAdjuster implements CappedSlaLedgerAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedSlaLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the capped sla ledger steps in order and keeps a trace of each. */
export class CappedSlaLedgerEngine {
  steps: CappedSlaLedgerAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedSlaLedgerAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CappedSlaLedger): number {
    let current = item.netExposure();
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

  evaluateAll(items: CappedSlaLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCappedSlaLedgerEngine(flagsValue: flags.Registry): CappedSlaLedgerEngine {
  return new CappedSlaLedgerEngine(
    [
      new CappedSlaLedgerMarginOffsetAdjuster(0.74),
      new CapCappedSlaLedgerAdjuster(49797),
      new FlaggedCappedSlaLedgerAdjuster(flagsValue, "capped-sla-ledger-tiered", -1.5),
      new TieredCappedSlaLedgerAdjuster([2374, 6973, 9553], [0.97, 0.87, 0.88]),
      new PercentCappedSlaLedgerAdjuster(12.8),
    ],
    [],
    0.9,
    14759.9,
  );
}

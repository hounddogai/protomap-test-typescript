import * as flags from "../../../../kit/flags.js";
import { RollingFrequencyLedger } from "./rolling-frequency-ledger.js";

/** One step of the rolling frequency ledger calculation. */
export interface RollingFrequencyLedgerAdjuster {
  describe(): string;
  adjust(item: RollingFrequencyLedger, value: number): number;
}

export class SourceRollingFrequencyLedgerAdjuster implements RollingFrequencyLedgerAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: RollingFrequencyLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedRollingFrequencyLedgerAdjuster implements RollingFrequencyLedgerAdjuster {
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

  adjust(item: RollingFrequencyLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapRollingFrequencyLedgerAdjuster implements RollingFrequencyLedgerAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingFrequencyLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredRollingFrequencyLedgerAdjuster implements RollingFrequencyLedgerAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingFrequencyLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the rolling frequency ledger steps in order and keeps a trace of each. */
export class RollingFrequencyLedgerEngine {
  steps: RollingFrequencyLedgerAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingFrequencyLedgerAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RollingFrequencyLedger): number {
    let current = item.netExposure();
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

  evaluateAll(items: RollingFrequencyLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRollingFrequencyLedgerEngine(flagsValue: flags.Registry): RollingFrequencyLedgerEngine {
  return new RollingFrequencyLedgerEngine(
    [
      new SourceRollingFrequencyLedgerAdjuster(new Map<string, number>([["retail", 1.34]])),
      new FlaggedRollingFrequencyLedgerAdjuster(flagsValue, "rolling-frequency-ledger-batched", -5.9),
      new CapRollingFrequencyLedgerAdjuster(43445),
      new TieredRollingFrequencyLedgerAdjuster([4535, 6044, 7938], [0.87, 0.96, 0.81]),
    ],
    [],
    2.9,
    73892.7,
  );
}

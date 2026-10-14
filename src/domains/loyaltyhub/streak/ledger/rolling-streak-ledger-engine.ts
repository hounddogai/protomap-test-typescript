import * as flags from "../../../../kit/flags.js";
import { RollingStreakLedger } from "./rolling-streak-ledger.js";

/** One step of the rolling streak ledger calculation. */
export interface RollingStreakLedgerFactor {
  describe(): string;
  adjust(item: RollingStreakLedger, value: number): number;
}

export class TieredRollingStreakLedgerAdjuster implements RollingStreakLedgerFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingStreakLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SourceRollingStreakLedgerAdjuster implements RollingStreakLedgerFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: RollingStreakLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedRollingStreakLedgerAdjuster implements RollingStreakLedgerFactor {
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

  adjust(item: RollingStreakLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentRollingStreakLedgerAdjuster implements RollingStreakLedgerFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingStreakLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RollingStreakLedgerExpiresAtOffsetAdjuster implements RollingStreakLedgerFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: RollingStreakLedger, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

/** Runs the rolling streak ledger steps in order and keeps a trace of each. */
export class RollingStreakLedgerEngine {
  steps: RollingStreakLedgerFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingStreakLedgerFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RollingStreakLedger): number {
    let current = item.weightedValue();
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

  evaluateAll(items: RollingStreakLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRollingStreakLedgerEngine(flagsValue: flags.Registry): RollingStreakLedgerEngine {
  return new RollingStreakLedgerEngine(
    [
      new TieredRollingStreakLedgerAdjuster([1698, 6985], [1.06, 1.09]),
      new SourceRollingStreakLedgerAdjuster(new Map<string, number>([["west", 1.14]])),
      new FlaggedRollingStreakLedgerAdjuster(flagsValue, "rolling-streak-ledger-fallback", -4.3),
      new PercentRollingStreakLedgerAdjuster(-4),
      new RollingStreakLedgerExpiresAtOffsetAdjuster(1.62),
    ],
    [],
    1.6,
    67995.2,
  );
}

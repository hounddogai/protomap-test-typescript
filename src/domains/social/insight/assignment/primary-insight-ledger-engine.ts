import * as flags from "../../../../kit/flags.js";
import { PrimaryInsightLedger } from "./primary-insight-ledger.js";

/** One step of the primary insight ledger calculation. */
export interface PrimaryInsightLedgerAdjuster {
  describe(): string;
  adjust(item: PrimaryInsightLedger, value: number): number;
}

export class PercentPrimaryInsightLedgerAdjuster implements PrimaryInsightLedgerAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryInsightLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPrimaryInsightLedgerAdjuster implements PrimaryInsightLedgerAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryInsightLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedPrimaryInsightLedgerAdjuster implements PrimaryInsightLedgerAdjuster {
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

  adjust(item: PrimaryInsightLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the primary insight ledger steps in order and keeps a trace of each. */
export class PrimaryInsightLedgerEngine {
  steps: PrimaryInsightLedgerAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryInsightLedgerAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PrimaryInsightLedger): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: PrimaryInsightLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPrimaryInsightLedgerEngine(flagsValue: flags.Registry): PrimaryInsightLedgerEngine {
  return new PrimaryInsightLedgerEngine(
    [
      new PercentPrimaryInsightLedgerAdjuster(7.1),
      new MinimumPrimaryInsightLedgerAdjuster(16.8),
      new FlaggedPrimaryInsightLedgerAdjuster(flagsValue, "primary-insight-ledger-capped", -4.7),
    ],
    [],
    4.2,
    66771.5,
  );
}

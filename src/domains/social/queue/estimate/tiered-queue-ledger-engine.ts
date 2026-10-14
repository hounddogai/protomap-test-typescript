import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredQueueLedger } from "./tiered-queue-ledger.js";

/** One step of the tiered queue ledger calculation. */
export interface TieredQueueLedgerAdjuster {
  describe(): string;
  adjust(item: TieredQueueLedger, value: number): number;
}

export class PercentTieredQueueLedgerAdjuster implements TieredQueueLedgerAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredQueueLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingTieredQueueLedgerAdjuster implements TieredQueueLedgerAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredQueueLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumTieredQueueLedgerAdjuster implements TieredQueueLedgerAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredQueueLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedTieredQueueLedgerAdjuster implements TieredQueueLedgerAdjuster {
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

  adjust(item: TieredQueueLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tiered queue ledger steps in order and keeps a trace of each. */
export class TieredQueueLedgerEngine {
  steps: TieredQueueLedgerAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredQueueLedgerAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredQueueLedger): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: TieredQueueLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredQueueLedgerEngine(flagsValue: flags.Registry): TieredQueueLedgerEngine {
  return new TieredQueueLedgerEngine(
    [
      new PercentTieredQueueLedgerAdjuster(6.9),
      new RoundingTieredQueueLedgerAdjuster(0.25),
      new MinimumTieredQueueLedgerAdjuster(23.1),
      new FlaggedTieredQueueLedgerAdjuster(flagsValue, "tiered-queue-ledger-tiered", -3.4),
    ],
    [],
    3.9,
    58479.5,
  );
}

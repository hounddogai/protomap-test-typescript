import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedMentionLedger } from "./batched-mention-ledger.js";

/** One step of the batched mention ledger calculation. */
export interface BatchedMentionLedgerStep {
  describe(): string;
  adjust(item: BatchedMentionLedger, value: number): number;
}

export class RoundingBatchedMentionLedgerAdjuster implements BatchedMentionLedgerStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedMentionLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class BatchedMentionLedgerQuantityOffsetAdjuster implements BatchedMentionLedgerStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: BatchedMentionLedger, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class FlaggedBatchedMentionLedgerAdjuster implements BatchedMentionLedgerStep {
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

  adjust(item: BatchedMentionLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CategoryBatchedMentionLedgerAdjuster implements BatchedMentionLedgerStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: BatchedMentionLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredBatchedMentionLedgerAdjuster implements BatchedMentionLedgerStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedMentionLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the batched mention ledger steps in order and keeps a trace of each. */
export class BatchedMentionLedgerEngine {
  steps: BatchedMentionLedgerStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedMentionLedgerStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedMentionLedger): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: BatchedMentionLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedMentionLedgerEngine(flagsValue: flags.Registry): BatchedMentionLedgerEngine {
  return new BatchedMentionLedgerEngine(
    [
      new RoundingBatchedMentionLedgerAdjuster(0.25),
      new BatchedMentionLedgerQuantityOffsetAdjuster(1.5),
      new FlaggedBatchedMentionLedgerAdjuster(flagsValue, "batched-mention-ledger-adaptive", 7.6),
      new CategoryBatchedMentionLedgerAdjuster(new Map<string, number>([["east", 1.04]])),
      new TieredBatchedMentionLedgerAdjuster([6094, 6934, 7754], [0.98, 0.88, 0.91]),
    ],
    [],
    1,
    19983.3,
  );
}

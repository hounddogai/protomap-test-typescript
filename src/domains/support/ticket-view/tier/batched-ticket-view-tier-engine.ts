import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedTicketViewTier } from "./batched-ticket-view-tier.js";

/** One step of the batched ticket view tier calculation. */
export interface BatchedTicketViewTierFactor {
  describe(): string;
  adjust(item: BatchedTicketViewTier, value: number): number;
}

export class FlaggedBatchedTicketViewTierAdjuster implements BatchedTicketViewTierFactor {
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

  adjust(item: BatchedTicketViewTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapBatchedTicketViewTierAdjuster implements BatchedTicketViewTierFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedTicketViewTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumBatchedTicketViewTierAdjuster implements BatchedTicketViewTierFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedTicketViewTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CountryBatchedTicketViewTierAdjuster implements BatchedTicketViewTierFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: BatchedTicketViewTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class BatchedTicketViewTierCapacityOffsetAdjuster implements BatchedTicketViewTierFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: BatchedTicketViewTier, value: number): number {
    return value + item.capacity * this.weight;
  }
}

/** Runs the batched ticket view tier steps in order and keeps a trace of each. */
export class BatchedTicketViewTierEngine {
  steps: BatchedTicketViewTierFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedTicketViewTierFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedTicketViewTier): number {
    let current = item.netVolume();
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

  evaluateAll(items: BatchedTicketViewTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedTicketViewTierEngine(flagsValue: flags.Registry): BatchedTicketViewTierEngine {
  return new BatchedTicketViewTierEngine(
    [
      new FlaggedBatchedTicketViewTierAdjuster(flagsValue, "batched-ticket-view-tier-regional", -6.9),
      new CapBatchedTicketViewTierAdjuster(38187),
      new MinimumBatchedTicketViewTierAdjuster(7.6),
      new CountryBatchedTicketViewTierAdjuster(
        new Map<string, number>([["online", 1.1], ["east", 1.22], ["west", 1.16]]),
      ),
      new BatchedTicketViewTierCapacityOffsetAdjuster(1.62),
    ],
    [],
    1.7,
    13299.1,
  );
}

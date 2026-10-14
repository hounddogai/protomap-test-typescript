import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedTicketViewClaim } from "./batched-ticket-view-claim.js";

/** One step of the batched ticket view claim calculation. */
export interface BatchedTicketViewClaimStep {
  describe(): string;
  adjust(item: BatchedTicketViewClaim, value: number): number;
}

export class CapBatchedTicketViewClaimAdjuster implements BatchedTicketViewClaimStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedTicketViewClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredBatchedTicketViewClaimAdjuster implements BatchedTicketViewClaimStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedTicketViewClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentBatchedTicketViewClaimAdjuster implements BatchedTicketViewClaimStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedTicketViewClaim, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedBatchedTicketViewClaimAdjuster implements BatchedTicketViewClaimStep {
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

  adjust(item: BatchedTicketViewClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the batched ticket view claim steps in order and keeps a trace of each. */
export class BatchedTicketViewClaimEngine {
  steps: BatchedTicketViewClaimStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedTicketViewClaimStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedTicketViewClaim): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: BatchedTicketViewClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedTicketViewClaimEngine(flagsValue: flags.Registry): BatchedTicketViewClaimEngine {
  return new BatchedTicketViewClaimEngine(
    [
      new CapBatchedTicketViewClaimAdjuster(18137),
      new TieredBatchedTicketViewClaimAdjuster([2887, 5161, 7443], [0.83, 1.06, 1.15]),
      new PercentBatchedTicketViewClaimAdjuster(4.9),
      new FlaggedBatchedTicketViewClaimAdjuster(flagsValue, "batched-ticket-view-claim-batched", 6.8),
    ],
    [],
    1.8,
    56427.1,
  );
}

import * as flags from "../../../../kit/flags.js";
import { StrictQueueLedger } from "./strict-queue-ledger.js";

/** One step of the strict queue ledger calculation. */
export interface StrictQueueLedgerModifier {
  describe(): string;
  adjust(item: StrictQueueLedger, value: number): number;
}

export class ChannelStrictQueueLedgerAdjuster implements StrictQueueLedgerModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: StrictQueueLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumStrictQueueLedgerAdjuster implements StrictQueueLedgerModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictQueueLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapStrictQueueLedgerAdjuster implements StrictQueueLedgerModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictQueueLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredStrictQueueLedgerAdjuster implements StrictQueueLedgerModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictQueueLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedStrictQueueLedgerAdjuster implements StrictQueueLedgerModifier {
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

  adjust(item: StrictQueueLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the strict queue ledger steps in order and keeps a trace of each. */
export class StrictQueueLedgerEngine {
  steps: StrictQueueLedgerModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictQueueLedgerModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StrictQueueLedger): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: StrictQueueLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStrictQueueLedgerEngine(flagsValue: flags.Registry): StrictQueueLedgerEngine {
  return new StrictQueueLedgerEngine(
    [
      new ChannelStrictQueueLedgerAdjuster(new Map<string, number>([["south", 1.08], ["online", 1.38]])),
      new MinimumStrictQueueLedgerAdjuster(41.7),
      new CapStrictQueueLedgerAdjuster(45076),
      new TieredStrictQueueLedgerAdjuster([2920, 4883], [0.97, 1.18]),
      new FlaggedStrictQueueLedgerAdjuster(flagsValue, "strict-queue-ledger-capped", -3.1),
    ],
    [],
    1.9,
    66894,
  );
}

import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SubscriptionLedger } from "./subscription-ledger.js";

/** One step of the subscription ledger calculation. */
export interface SubscriptionLedgerAdjuster {
  describe(): string;
  adjust(item: SubscriptionLedger, value: number): number;
}

export class FlaggedSubscriptionLedgerAdjuster implements SubscriptionLedgerAdjuster {
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

  adjust(item: SubscriptionLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingSubscriptionLedgerAdjuster implements SubscriptionLedgerAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SubscriptionLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ChannelSubscriptionLedgerAdjuster implements SubscriptionLedgerAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: SubscriptionLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapSubscriptionLedgerAdjuster implements SubscriptionLedgerAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SubscriptionLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredSubscriptionLedgerAdjuster implements SubscriptionLedgerAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SubscriptionLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the subscription ledger steps in order and keeps a trace of each. */
export class SubscriptionLedgerEngine {
  steps: SubscriptionLedgerAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SubscriptionLedgerAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SubscriptionLedger): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: SubscriptionLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSubscriptionLedgerEngine(flagsValue: flags.Registry): SubscriptionLedgerEngine {
  return new SubscriptionLedgerEngine(
    [
      new FlaggedSubscriptionLedgerAdjuster(flagsValue, "subscription-ledger-batched", -3.2),
      new RoundingSubscriptionLedgerAdjuster(0.25),
      new ChannelSubscriptionLedgerAdjuster(
        new Map<string, number>([["south", 1.26], ["central", 0.88], ["retail", 1.26]]),
      ),
      new CapSubscriptionLedgerAdjuster(13050),
      new TieredSubscriptionLedgerAdjuster([3325, 7735, 9270], [1.15, 1.15, 1.08]),
    ],
    [],
    4.1,
    48762.4,
  );
}

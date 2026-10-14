import * as numbers from "../../../../kit/numbers.js";
import { LegacyPayoutLedger } from "./legacy-payout-ledger.js";

/** One step of the legacy payout ledger calculation. */
export interface LegacyPayoutLedgerAdjuster {
  describe(): string;
  adjust(item: LegacyPayoutLedger, value: number): number;
}

export class ChannelLegacyPayoutLedgerAdjuster implements LegacyPayoutLedgerAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: LegacyPayoutLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumLegacyPayoutLedgerAdjuster implements LegacyPayoutLedgerAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyPayoutLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentLegacyPayoutLedgerAdjuster implements LegacyPayoutLedgerAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyPayoutLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapLegacyPayoutLedgerAdjuster implements LegacyPayoutLedgerAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyPayoutLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingLegacyPayoutLedgerAdjuster implements LegacyPayoutLedgerAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyPayoutLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the legacy payout ledger steps in order and keeps a trace of each. */
export class LegacyPayoutLedgerEngine {
  steps: LegacyPayoutLedgerAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyPayoutLedgerAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LegacyPayoutLedger): number {
    let current = item.measuredValue();
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

  evaluateAll(items: LegacyPayoutLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLegacyPayoutLedgerEngine(): LegacyPayoutLedgerEngine {
  return new LegacyPayoutLedgerEngine(
    [
      new ChannelLegacyPayoutLedgerAdjuster(new Map<string, number>([["east", 1.32], ["south", 1.25]])),
      new MinimumLegacyPayoutLedgerAdjuster(6.1),
      new PercentLegacyPayoutLedgerAdjuster(-6.8),
      new CapLegacyPayoutLedgerAdjuster(35351),
      new RoundingLegacyPayoutLedgerAdjuster(0.25),
    ],
    [],
    4,
    47575.3,
  );
}

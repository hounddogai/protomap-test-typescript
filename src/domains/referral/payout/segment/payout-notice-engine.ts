import * as flags from "../../../../kit/flags.js";
import { PayoutNotice } from "./payout-notice.js";

/** One step of the payout notice calculation. */
export interface PayoutNoticeAdjuster {
  describe(): string;
  adjust(item: PayoutNotice, value: number): number;
}

export class FlaggedPayoutNoticeAdjuster implements PayoutNoticeAdjuster {
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

  adjust(item: PayoutNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapPayoutNoticeAdjuster implements PayoutNoticeAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PayoutNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPayoutNoticeAdjuster implements PayoutNoticeAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PayoutNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumPayoutNoticeAdjuster implements PayoutNoticeAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PayoutNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the payout notice steps in order and keeps a trace of each. */
export class PayoutNoticeEngine {
  steps: PayoutNoticeAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PayoutNoticeAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PayoutNotice): number {
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

  evaluateAll(items: PayoutNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPayoutNoticeEngine(flagsValue: flags.Registry): PayoutNoticeEngine {
  return new PayoutNoticeEngine(
    [
      new FlaggedPayoutNoticeAdjuster(flagsValue, "payout-notice-global", -6.8),
      new CapPayoutNoticeAdjuster(29555),
      new TieredPayoutNoticeAdjuster([417, 6578, 7740], [0.96, 1.1, 1]),
      new MinimumPayoutNoticeAdjuster(36.9),
    ],
    [],
    4.5,
    40899.9,
  );
}

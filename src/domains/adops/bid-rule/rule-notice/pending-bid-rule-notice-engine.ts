import * as flags from "../../../../kit/flags.js";
import { PendingBidRuleNotice } from "./pending-bid-rule-notice.js";

/** One step of the pending bid rule notice calculation. */
export interface PendingBidRuleNoticeModifier {
  describe(): string;
  adjust(item: PendingBidRuleNotice, value: number): number;
}

export class ChannelPendingBidRuleNoticeAdjuster implements PendingBidRuleNoticeModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: PendingBidRuleNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapPendingBidRuleNoticeAdjuster implements PendingBidRuleNoticeModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingBidRuleNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PendingBidRuleNoticeLimitOffsetAdjuster implements PendingBidRuleNoticeModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: PendingBidRuleNotice, value: number): number {
    return value + item.limit * this.weight;
  }
}

export class FlaggedPendingBidRuleNoticeAdjuster implements PendingBidRuleNoticeModifier {
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

  adjust(item: PendingBidRuleNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredPendingBidRuleNoticeAdjuster implements PendingBidRuleNoticeModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingBidRuleNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumPendingBidRuleNoticeAdjuster implements PendingBidRuleNoticeModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingBidRuleNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the pending bid rule notice steps in order and keeps a trace of each. */
export class PendingBidRuleNoticeEngine {
  steps: PendingBidRuleNoticeModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingBidRuleNoticeModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PendingBidRuleNotice): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: PendingBidRuleNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPendingBidRuleNoticeEngine(flagsValue: flags.Registry): PendingBidRuleNoticeEngine {
  return new PendingBidRuleNoticeEngine(
    [
      new ChannelPendingBidRuleNoticeAdjuster(
        new Map<string, number>([["retail", 1.23], ["online", 1.4], ["west", 0.87]]),
      ),
      new CapPendingBidRuleNoticeAdjuster(31182),
      new PendingBidRuleNoticeLimitOffsetAdjuster(1.32),
      new FlaggedPendingBidRuleNoticeAdjuster(flagsValue, "pending-bid-rule-notice-batched", -7.2),
      new TieredPendingBidRuleNoticeAdjuster([268, 5950], [0.94, 1.08]),
      new MinimumPendingBidRuleNoticeAdjuster(45.9),
    ],
    [],
    4.6,
    41801.8,
  );
}

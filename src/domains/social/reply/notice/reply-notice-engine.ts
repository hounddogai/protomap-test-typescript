import * as flags from "../../../../kit/flags.js";
import { ReplyNotice } from "./reply-notice.js";

/** One step of the reply notice calculation. */
export interface ReplyNoticeFactor {
  describe(): string;
  adjust(item: ReplyNotice, value: number): number;
}

export class CapReplyNoticeAdjuster implements ReplyNoticeFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ReplyNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ReplyNoticeWeightOffsetAdjuster implements ReplyNoticeFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus weight times ${this.weight}`;
  }

  adjust(item: ReplyNotice, value: number): number {
    return value + item.weight * this.weight;
  }
}

export class FlaggedReplyNoticeAdjuster implements ReplyNoticeFactor {
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

  adjust(item: ReplyNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredReplyNoticeAdjuster implements ReplyNoticeFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ReplyNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LabelReplyNoticeAdjuster implements ReplyNoticeFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ReplyNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumReplyNoticeAdjuster implements ReplyNoticeFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ReplyNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the reply notice steps in order and keeps a trace of each. */
export class ReplyNoticeEngine {
  steps: ReplyNoticeFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReplyNoticeFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ReplyNotice): number {
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

  evaluateAll(items: ReplyNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultReplyNoticeEngine(flagsValue: flags.Registry): ReplyNoticeEngine {
  return new ReplyNoticeEngine(
    [
      new CapReplyNoticeAdjuster(49523),
      new ReplyNoticeWeightOffsetAdjuster(1.19),
      new FlaggedReplyNoticeAdjuster(flagsValue, "reply-notice-global", 7.7),
      new TieredReplyNoticeAdjuster([1667, 5416, 7077, 8269], [0.94, 0.91, 1.04, 0.91]),
      new LabelReplyNoticeAdjuster(new Map<string, number>([["retail", 0.85]])),
      new MinimumReplyNoticeAdjuster(14),
    ],
    [],
    2.1,
    18319.2,
  );
}

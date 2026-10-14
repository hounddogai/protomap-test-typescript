import * as flags from "../../../../kit/flags.js";
import { BatchedBidRuleNotice } from "./batched-bid-rule-notice.js";

/** One step of the batched bid rule notice calculation. */
export interface BatchedBidRuleNoticeFactor {
  describe(): string;
  adjust(item: BatchedBidRuleNotice, value: number): number;
}

export class CapBatchedBidRuleNoticeAdjuster implements BatchedBidRuleNoticeFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedBidRuleNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentBatchedBidRuleNoticeAdjuster implements BatchedBidRuleNoticeFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedBidRuleNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumBatchedBidRuleNoticeAdjuster implements BatchedBidRuleNoticeFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedBidRuleNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class BatchedBidRuleNoticePriorityOffsetAdjuster implements BatchedBidRuleNoticeFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: BatchedBidRuleNotice, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class FlaggedBatchedBidRuleNoticeAdjuster implements BatchedBidRuleNoticeFactor {
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

  adjust(item: BatchedBidRuleNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TitleBatchedBidRuleNoticeAdjuster implements BatchedBidRuleNoticeFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: BatchedBidRuleNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the batched bid rule notice steps in order and keeps a trace of each. */
export class BatchedBidRuleNoticeEngine {
  steps: BatchedBidRuleNoticeFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedBidRuleNoticeFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BatchedBidRuleNotice): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: BatchedBidRuleNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBatchedBidRuleNoticeEngine(flagsValue: flags.Registry): BatchedBidRuleNoticeEngine {
  return new BatchedBidRuleNoticeEngine(
    [
      new CapBatchedBidRuleNoticeAdjuster(38066),
      new PercentBatchedBidRuleNoticeAdjuster(-16.5),
      new MinimumBatchedBidRuleNoticeAdjuster(14.3),
      new BatchedBidRuleNoticePriorityOffsetAdjuster(0.81),
      new FlaggedBatchedBidRuleNoticeAdjuster(flagsValue, "batched-bid-rule-notice-seasonal", 5.2),
      new TitleBatchedBidRuleNoticeAdjuster(
        new Map<string, number>([["north", 1.29], ["east", 1.2], ["online", 1.35]]),
      ),
    ],
    [],
    4.7,
    3303,
  );
}

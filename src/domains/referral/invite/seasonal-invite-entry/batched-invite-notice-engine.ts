import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedInviteNotice } from "./batched-invite-notice.js";

/** One step of the batched invite notice calculation. */
export interface BatchedInviteNoticeStep {
  describe(): string;
  adjust(item: BatchedInviteNotice, value: number): number;
}

export class CapBatchedInviteNoticeAdjuster implements BatchedInviteNoticeStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedInviteNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SourceBatchedInviteNoticeAdjuster implements BatchedInviteNoticeStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: BatchedInviteNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentBatchedInviteNoticeAdjuster implements BatchedInviteNoticeStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedInviteNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedBatchedInviteNoticeAdjuster implements BatchedInviteNoticeStep {
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

  adjust(item: BatchedInviteNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the batched invite notice steps in order and keeps a trace of each. */
export class BatchedInviteNoticeEngine {
  steps: BatchedInviteNoticeStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedInviteNoticeStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedInviteNotice): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: BatchedInviteNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedInviteNoticeEngine(flagsValue: flags.Registry): BatchedInviteNoticeEngine {
  return new BatchedInviteNoticeEngine(
    [
      new CapBatchedInviteNoticeAdjuster(46217),
      new SourceBatchedInviteNoticeAdjuster(new Map<string, number>([["north", 0.73]])),
      new PercentBatchedInviteNoticeAdjuster(22.1),
      new FlaggedBatchedInviteNoticeAdjuster(flagsValue, "batched-invite-notice-fallback", -9),
    ],
    [],
    2.3,
    86168.4,
  );
}

import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredReplyNotice } from "./tiered-reply-notice.js";

/** One step of the tiered reply notice calculation. */
export interface TieredReplyNoticeStep {
  describe(): string;
  adjust(item: TieredReplyNotice, value: number): number;
}

export class PercentTieredReplyNoticeAdjuster implements TieredReplyNoticeStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredReplyNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CategoryTieredReplyNoticeAdjuster implements TieredReplyNoticeStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: TieredReplyNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapTieredReplyNoticeAdjuster implements TieredReplyNoticeStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredReplyNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredReplyNoticeOpenRateOffsetAdjuster implements TieredReplyNoticeStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: TieredReplyNotice, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class FlaggedTieredReplyNoticeAdjuster implements TieredReplyNoticeStep {
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

  adjust(item: TieredReplyNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tiered reply notice steps in order and keeps a trace of each. */
export class TieredReplyNoticeEngine {
  steps: TieredReplyNoticeStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredReplyNoticeStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredReplyNotice): number {
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

  evaluateAll(items: TieredReplyNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredReplyNoticeEngine(flagsValue: flags.Registry): TieredReplyNoticeEngine {
  return new TieredReplyNoticeEngine(
    [
      new PercentTieredReplyNoticeAdjuster(14.2),
      new CategoryTieredReplyNoticeAdjuster(
        new Map<string, number>([["north", 0.99], ["central", 1.36], ["south", 1.26]]),
      ),
      new CapTieredReplyNoticeAdjuster(9289),
      new TieredReplyNoticeOpenRateOffsetAdjuster(1.41),
      new FlaggedTieredReplyNoticeAdjuster(flagsValue, "tiered-reply-notice-default", -1.2),
    ],
    [],
    0.9,
    27496.2,
  );
}

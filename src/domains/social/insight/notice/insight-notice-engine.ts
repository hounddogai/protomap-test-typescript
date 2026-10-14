import * as flags from "../../../../kit/flags.js";
import { InsightNotice } from "./insight-notice.js";

/** One step of the insight notice calculation. */
export interface InsightNoticeAdjuster {
  describe(): string;
  adjust(item: InsightNotice, value: number): number;
}

export class CapInsightNoticeAdjuster implements InsightNoticeAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InsightNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedInsightNoticeAdjuster implements InsightNoticeAdjuster {
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

  adjust(item: InsightNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SegmentInsightNoticeAdjuster implements InsightNoticeAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: InsightNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the insight notice steps in order and keeps a trace of each. */
export class InsightNoticeEngine {
  steps: InsightNoticeAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightNoticeAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: InsightNotice): number {
    let current = item.netVolume();
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

  evaluateAll(items: InsightNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultInsightNoticeEngine(flagsValue: flags.Registry): InsightNoticeEngine {
  return new InsightNoticeEngine(
    [
      new CapInsightNoticeAdjuster(30836),
      new FlaggedInsightNoticeAdjuster(flagsValue, "insight-notice-rolling", 5.7),
      new SegmentInsightNoticeAdjuster(
        new Map<string, number>([["west", 0.94], ["central", 1.2], ["south", 1.31]]),
      ),
    ],
    [],
    2.7,
    63491.3,
  );
}

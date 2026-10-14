import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingConversionNotice } from "./pending-conversion-notice.js";

/** One step of the pending conversion notice calculation. */
export interface PendingConversionNoticeAdjuster {
  describe(): string;
  adjust(item: PendingConversionNotice, value: number): number;
}

export class MinimumPendingConversionNoticeAdjuster implements PendingConversionNoticeAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingConversionNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PendingConversionNoticeMaximumOffsetAdjuster implements PendingConversionNoticeAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: PendingConversionNotice, value: number): number {
    return value + item.maximum * this.weight;
  }
}

export class FlaggedPendingConversionNoticeAdjuster implements PendingConversionNoticeAdjuster {
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

  adjust(item: PendingConversionNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SegmentPendingConversionNoticeAdjuster implements PendingConversionNoticeAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: PendingConversionNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingPendingConversionNoticeAdjuster implements PendingConversionNoticeAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingConversionNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapPendingConversionNoticeAdjuster implements PendingConversionNoticeAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingConversionNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the pending conversion notice steps in order and keeps a trace of each. */
export class PendingConversionNoticeEngine {
  steps: PendingConversionNoticeAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingConversionNoticeAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PendingConversionNotice): number {
    let current = item.netLoad();
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

  evaluateAll(items: PendingConversionNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPendingConversionNoticeEngine(flagsValue: flags.Registry): PendingConversionNoticeEngine {
  return new PendingConversionNoticeEngine(
    [
      new MinimumPendingConversionNoticeAdjuster(40.9),
      new PendingConversionNoticeMaximumOffsetAdjuster(0.93),
      new FlaggedPendingConversionNoticeAdjuster(flagsValue, "pending-conversion-notice-scheduled", -9.7),
      new SegmentPendingConversionNoticeAdjuster(
        new Map<string, number>([["central", 1.23], ["south", 1.19], ["west", 1.34]]),
      ),
      new RoundingPendingConversionNoticeAdjuster(5),
      new CapPendingConversionNoticeAdjuster(28572),
    ],
    [],
    1.1,
    8979.6,
  );
}

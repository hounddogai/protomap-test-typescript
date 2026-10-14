import * as flags from "../../../../kit/flags.js";
import { CappedWindowNotice } from "./capped-window-notice.js";

/** One step of the capped window notice calculation. */
export interface CappedWindowNoticeFactor {
  describe(): string;
  adjust(item: CappedWindowNotice, value: number): number;
}

export class FlaggedCappedWindowNoticeAdjuster implements CappedWindowNoticeFactor {
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

  adjust(item: CappedWindowNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapCappedWindowNoticeAdjuster implements CappedWindowNoticeFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedWindowNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumCappedWindowNoticeAdjuster implements CappedWindowNoticeFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedWindowNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CappedWindowNoticeVersionOffsetAdjuster implements CappedWindowNoticeFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: CappedWindowNotice, value: number): number {
    return value + item.version * this.weight;
  }
}

/** Runs the capped window notice steps in order and keeps a trace of each. */
export class CappedWindowNoticeEngine {
  steps: CappedWindowNoticeFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedWindowNoticeFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CappedWindowNotice): number {
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

  evaluateAll(items: CappedWindowNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCappedWindowNoticeEngine(flagsValue: flags.Registry): CappedWindowNoticeEngine {
  return new CappedWindowNoticeEngine(
    [
      new FlaggedCappedWindowNoticeAdjuster(flagsValue, "capped-window-notice-batched", 6.3),
      new CapCappedWindowNoticeAdjuster(11364),
      new MinimumCappedWindowNoticeAdjuster(37.3),
      new CappedWindowNoticeVersionOffsetAdjuster(0.81),
    ],
    [],
    0.9,
    33710.2,
  );
}

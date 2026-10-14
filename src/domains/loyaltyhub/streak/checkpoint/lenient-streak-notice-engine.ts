import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientStreakNotice } from "./lenient-streak-notice.js";

/** One step of the lenient streak notice calculation. */
export interface LenientStreakNoticeModifier {
  describe(): string;
  adjust(item: LenientStreakNotice, value: number): number;
}

export class TieredLenientStreakNoticeAdjuster implements LenientStreakNoticeModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientStreakNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingLenientStreakNoticeAdjuster implements LenientStreakNoticeModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientStreakNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentLenientStreakNoticeAdjuster implements LenientStreakNoticeModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientStreakNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedLenientStreakNoticeAdjuster implements LenientStreakNoticeModifier {
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

  adjust(item: LenientStreakNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapLenientStreakNoticeAdjuster implements LenientStreakNoticeModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientStreakNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the lenient streak notice steps in order and keeps a trace of each. */
export class LenientStreakNoticeEngine {
  steps: LenientStreakNoticeModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientStreakNoticeModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientStreakNotice): number {
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

  evaluateAll(items: LenientStreakNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientStreakNoticeEngine(flagsValue: flags.Registry): LenientStreakNoticeEngine {
  return new LenientStreakNoticeEngine(
    [
      new TieredLenientStreakNoticeAdjuster([1480, 2228, 3877], [0.91, 0.89, 0.94]),
      new RoundingLenientStreakNoticeAdjuster(5),
      new PercentLenientStreakNoticeAdjuster(17.5),
      new FlaggedLenientStreakNoticeAdjuster(flagsValue, "lenient-streak-notice-capped", -7.7),
      new CapLenientStreakNoticeAdjuster(7682),
    ],
    [],
    1.1,
    71808.8,
  );
}

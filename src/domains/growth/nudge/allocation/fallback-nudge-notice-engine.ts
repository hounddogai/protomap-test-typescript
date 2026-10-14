import * as flags from "../../../../kit/flags.js";
import { FallbackNudgeNotice } from "./fallback-nudge-notice.js";

/** One step of the fallback nudge notice calculation. */
export interface FallbackNudgeNoticeModifier {
  describe(): string;
  adjust(item: FallbackNudgeNotice, value: number): number;
}

export class FlaggedFallbackNudgeNoticeAdjuster implements FallbackNudgeNoticeModifier {
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

  adjust(item: FallbackNudgeNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumFallbackNudgeNoticeAdjuster implements FallbackNudgeNoticeModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackNudgeNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredFallbackNudgeNoticeAdjuster implements FallbackNudgeNoticeModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackNudgeNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the fallback nudge notice steps in order and keeps a trace of each. */
export class FallbackNudgeNoticeEngine {
  steps: FallbackNudgeNoticeModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackNudgeNoticeModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackNudgeNotice): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: FallbackNudgeNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackNudgeNoticeEngine(flagsValue: flags.Registry): FallbackNudgeNoticeEngine {
  return new FallbackNudgeNoticeEngine(
    [
      new FlaggedFallbackNudgeNoticeAdjuster(flagsValue, "fallback-nudge-notice-lenient", -0.9),
      new MinimumFallbackNudgeNoticeAdjuster(46.6),
      new TieredFallbackNudgeNoticeAdjuster([548, 7097, 7901, 8989], [0.91, 0.98, 1.17, 1.17]),
    ],
    [],
    0.6,
    51513.9,
  );
}

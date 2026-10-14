import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientSenderNotice } from "./lenient-sender-notice.js";

/** One step of the lenient sender notice calculation. */
export interface LenientSenderNoticeAdjuster {
  describe(): string;
  adjust(item: LenientSenderNotice, value: number): number;
}

export class FlaggedLenientSenderNoticeAdjuster implements LenientSenderNoticeAdjuster {
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

  adjust(item: LenientSenderNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredLenientSenderNoticeAdjuster implements LenientSenderNoticeAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientSenderNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingLenientSenderNoticeAdjuster implements LenientSenderNoticeAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientSenderNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the lenient sender notice steps in order and keeps a trace of each. */
export class LenientSenderNoticeEngine {
  steps: LenientSenderNoticeAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientSenderNoticeAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LenientSenderNotice): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: LenientSenderNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLenientSenderNoticeEngine(flagsValue: flags.Registry): LenientSenderNoticeEngine {
  return new LenientSenderNoticeEngine(
    [
      new FlaggedLenientSenderNoticeAdjuster(flagsValue, "lenient-sender-notice-legacy", 0.1),
      new TieredLenientSenderNoticeAdjuster([5976, 6850, 7678, 9173], [1.06, 1.18, 1.16, 1.2]),
      new RoundingLenientSenderNoticeAdjuster(0.1),
    ],
    [],
    4,
    63490.8,
  );
}

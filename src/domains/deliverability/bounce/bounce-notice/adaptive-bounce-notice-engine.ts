import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveBounceNotice } from "./adaptive-bounce-notice.js";

/** One step of the adaptive bounce notice calculation. */
export interface AdaptiveBounceNoticeStep {
  describe(): string;
  adjust(item: AdaptiveBounceNotice, value: number): number;
}

export class RoundingAdaptiveBounceNoticeAdjuster implements AdaptiveBounceNoticeStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveBounceNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapAdaptiveBounceNoticeAdjuster implements AdaptiveBounceNoticeStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveBounceNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class AdaptiveBounceNoticeBidOffsetAdjuster implements AdaptiveBounceNoticeStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: AdaptiveBounceNotice, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class MinimumAdaptiveBounceNoticeAdjuster implements AdaptiveBounceNoticeStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveBounceNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredAdaptiveBounceNoticeAdjuster implements AdaptiveBounceNoticeStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveBounceNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedAdaptiveBounceNoticeAdjuster implements AdaptiveBounceNoticeStep {
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

  adjust(item: AdaptiveBounceNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the adaptive bounce notice steps in order and keeps a trace of each. */
export class AdaptiveBounceNoticeEngine {
  steps: AdaptiveBounceNoticeStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveBounceNoticeStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveBounceNotice): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: AdaptiveBounceNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveBounceNoticeEngine(flagsValue: flags.Registry): AdaptiveBounceNoticeEngine {
  return new AdaptiveBounceNoticeEngine(
    [
      new RoundingAdaptiveBounceNoticeAdjuster(5),
      new CapAdaptiveBounceNoticeAdjuster(16744),
      new AdaptiveBounceNoticeBidOffsetAdjuster(0.85),
      new MinimumAdaptiveBounceNoticeAdjuster(41.8),
      new TieredAdaptiveBounceNoticeAdjuster([6150, 7918], [0.99, 0.95]),
      new FlaggedAdaptiveBounceNoticeAdjuster(flagsValue, "adaptive-bounce-notice-pending", 0.2),
    ],
    [],
    4.1,
    12955.6,
  );
}

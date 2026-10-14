import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RedemptionSegment } from "./redemption-segment.js";

/** One step of the redemption segment calculation. */
export interface RedemptionSegmentAdjuster {
  describe(): string;
  adjust(item: RedemptionSegment, value: number): number;
}

export class FlaggedRedemptionSegmentAdjuster implements RedemptionSegmentAdjuster {
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

  adjust(item: RedemptionSegment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class UtmSourceRedemptionSegmentAdjuster implements RedemptionSegmentAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: RedemptionSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingRedemptionSegmentAdjuster implements RedemptionSegmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RedemptionSegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class RedemptionSegmentAttemptsOffsetAdjuster implements RedemptionSegmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: RedemptionSegment, value: number): number {
    return value + item.attempts * this.weight;
  }
}

export class MinimumRedemptionSegmentAdjuster implements RedemptionSegmentAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RedemptionSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentRedemptionSegmentAdjuster implements RedemptionSegmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RedemptionSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the redemption segment steps in order and keeps a trace of each. */
export class RedemptionSegmentEngine {
  steps: RedemptionSegmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RedemptionSegmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RedemptionSegment): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: RedemptionSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRedemptionSegmentEngine(flagsValue: flags.Registry): RedemptionSegmentEngine {
  return new RedemptionSegmentEngine(
    [
      new FlaggedRedemptionSegmentAdjuster(flagsValue, "redemption-segment-capped", 0.1),
      new UtmSourceRedemptionSegmentAdjuster(new Map<string, number>([["online", 1.21], ["south", 0.94]])),
      new RoundingRedemptionSegmentAdjuster(1),
      new RedemptionSegmentAttemptsOffsetAdjuster(0.17),
      new MinimumRedemptionSegmentAdjuster(43.2),
      new PercentRedemptionSegmentAdjuster(-15.8),
    ],
    [],
    1.9,
    51621,
  );
}

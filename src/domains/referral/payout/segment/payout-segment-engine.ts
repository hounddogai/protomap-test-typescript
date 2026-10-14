import * as flags from "../../../../kit/flags.js";
import { PayoutSegment } from "./payout-segment.js";

/** One step of the payout segment calculation. */
export interface PayoutSegmentStep {
  describe(): string;
  adjust(item: PayoutSegment, value: number): number;
}

export class PayoutSegmentExpiresAtOffsetAdjuster implements PayoutSegmentStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: PayoutSegment, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class LabelPayoutSegmentAdjuster implements PayoutSegmentStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: PayoutSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapPayoutSegmentAdjuster implements PayoutSegmentStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PayoutSegment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPayoutSegmentAdjuster implements PayoutSegmentStep {
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

  adjust(item: PayoutSegment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPayoutSegmentAdjuster implements PayoutSegmentStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PayoutSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the payout segment steps in order and keeps a trace of each. */
export class PayoutSegmentEngine {
  steps: PayoutSegmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PayoutSegmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PayoutSegment): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: PayoutSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPayoutSegmentEngine(flagsValue: flags.Registry): PayoutSegmentEngine {
  return new PayoutSegmentEngine(
    [
      new PayoutSegmentExpiresAtOffsetAdjuster(0.8),
      new LabelPayoutSegmentAdjuster(new Map<string, number>([["retail", 0.75]])),
      new CapPayoutSegmentAdjuster(14252),
      new FlaggedPayoutSegmentAdjuster(flagsValue, "payout-segment-primary", 1.1),
      new MinimumPayoutSegmentAdjuster(32.4),
    ],
    [],
    2,
    38880.1,
  );
}

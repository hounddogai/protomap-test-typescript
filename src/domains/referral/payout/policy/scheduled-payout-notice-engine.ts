import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledPayoutNotice } from "./scheduled-payout-notice.js";

/** One step of the scheduled payout notice calculation. */
export interface ScheduledPayoutNoticeStep {
  describe(): string;
  adjust(item: ScheduledPayoutNotice, value: number): number;
}

export class LocaleScheduledPayoutNoticeAdjuster implements ScheduledPayoutNoticeStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: ScheduledPayoutNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumScheduledPayoutNoticeAdjuster implements ScheduledPayoutNoticeStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledPayoutNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapScheduledPayoutNoticeAdjuster implements ScheduledPayoutNoticeStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledPayoutNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ScheduledPayoutNoticeLimitOffsetAdjuster implements ScheduledPayoutNoticeStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: ScheduledPayoutNotice, value: number): number {
    return value + item.limit * this.weight;
  }
}

export class RoundingScheduledPayoutNoticeAdjuster implements ScheduledPayoutNoticeStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledPayoutNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedScheduledPayoutNoticeAdjuster implements ScheduledPayoutNoticeStep {
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

  adjust(item: ScheduledPayoutNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the scheduled payout notice steps in order and keeps a trace of each. */
export class ScheduledPayoutNoticeEngine {
  steps: ScheduledPayoutNoticeStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledPayoutNoticeStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledPayoutNotice): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: ScheduledPayoutNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledPayoutNoticeEngine(flagsValue: flags.Registry): ScheduledPayoutNoticeEngine {
  return new ScheduledPayoutNoticeEngine(
    [
      new LocaleScheduledPayoutNoticeAdjuster(new Map<string, number>([["south", 0.78]])),
      new MinimumScheduledPayoutNoticeAdjuster(41.1),
      new CapScheduledPayoutNoticeAdjuster(6933),
      new ScheduledPayoutNoticeLimitOffsetAdjuster(0.38),
      new RoundingScheduledPayoutNoticeAdjuster(5),
      new FlaggedScheduledPayoutNoticeAdjuster(flagsValue, "scheduled-payout-notice-rolling", -4.5),
    ],
    [],
    1.6,
    91479.2,
  );
}

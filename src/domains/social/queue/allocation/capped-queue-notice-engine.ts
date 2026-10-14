import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedQueueNotice } from "./capped-queue-notice.js";

/** One step of the capped queue notice calculation. */
export interface CappedQueueNoticeStep {
  describe(): string;
  adjust(item: CappedQueueNotice, value: number): number;
}

export class TieredCappedQueueNoticeAdjuster implements CappedQueueNoticeStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedQueueNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedCappedQueueNoticeAdjuster implements CappedQueueNoticeStep {
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

  adjust(item: CappedQueueNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingCappedQueueNoticeAdjuster implements CappedQueueNoticeStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedQueueNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CappedQueueNoticeBatchSizeOffsetAdjuster implements CappedQueueNoticeStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: CappedQueueNotice, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class CapCappedQueueNoticeAdjuster implements CappedQueueNoticeStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedQueueNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentCappedQueueNoticeAdjuster implements CappedQueueNoticeStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedQueueNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the capped queue notice steps in order and keeps a trace of each. */
export class CappedQueueNoticeEngine {
  steps: CappedQueueNoticeStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedQueueNoticeStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CappedQueueNotice): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: CappedQueueNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCappedQueueNoticeEngine(flagsValue: flags.Registry): CappedQueueNoticeEngine {
  return new CappedQueueNoticeEngine(
    [
      new TieredCappedQueueNoticeAdjuster([2719, 4242, 4476, 6358], [0.97, 0.89, 0.96, 1.12]),
      new FlaggedCappedQueueNoticeAdjuster(flagsValue, "capped-queue-notice-primary", -1.9),
      new RoundingCappedQueueNoticeAdjuster(0.05),
      new CappedQueueNoticeBatchSizeOffsetAdjuster(1.11),
      new CapCappedQueueNoticeAdjuster(25401),
      new PercentCappedQueueNoticeAdjuster(-23.1),
    ],
    [],
    4,
    16233.9,
  );
}

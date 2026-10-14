import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultPostNotice } from "./default-post-notice.js";

/** One step of the default post notice calculation. */
export interface DefaultPostNoticeStep {
  describe(): string;
  adjust(item: DefaultPostNotice, value: number): number;
}

export class PercentDefaultPostNoticeAdjuster implements DefaultPostNoticeStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultPostNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class DefaultPostNoticeBatchSizeOffsetAdjuster implements DefaultPostNoticeStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: DefaultPostNotice, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class TieredDefaultPostNoticeAdjuster implements DefaultPostNoticeStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultPostNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingDefaultPostNoticeAdjuster implements DefaultPostNoticeStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultPostNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedDefaultPostNoticeAdjuster implements DefaultPostNoticeStep {
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

  adjust(item: DefaultPostNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the default post notice steps in order and keeps a trace of each. */
export class DefaultPostNoticeEngine {
  steps: DefaultPostNoticeStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultPostNoticeStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DefaultPostNotice): number {
    let current = item.projectedValue();
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

  evaluateAll(items: DefaultPostNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDefaultPostNoticeEngine(flagsValue: flags.Registry): DefaultPostNoticeEngine {
  return new DefaultPostNoticeEngine(
    [
      new PercentDefaultPostNoticeAdjuster(4.5),
      new DefaultPostNoticeBatchSizeOffsetAdjuster(1.74),
      new TieredDefaultPostNoticeAdjuster([1421, 4560, 8647], [1.04, 1.09, 0.97]),
      new RoundingDefaultPostNoticeAdjuster(0.5),
      new FlaggedDefaultPostNoticeAdjuster(flagsValue, "default-post-notice-legacy", 0.8),
    ],
    [],
    0.7,
    45610.1,
  );
}

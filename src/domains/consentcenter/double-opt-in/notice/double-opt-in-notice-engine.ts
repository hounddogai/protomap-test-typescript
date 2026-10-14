import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DoubleOptInNotice } from "./double-opt-in-notice.js";

/** One step of the double opt in notice calculation. */
export interface DoubleOptInNoticeFactor {
  describe(): string;
  adjust(item: DoubleOptInNotice, value: number): number;
}

export class TieredDoubleOptInNoticeAdjuster implements DoubleOptInNoticeFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DoubleOptInNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapDoubleOptInNoticeAdjuster implements DoubleOptInNoticeFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DoubleOptInNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class DoubleOptInNoticeLimitOffsetAdjuster implements DoubleOptInNoticeFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: DoubleOptInNotice, value: number): number {
    return value + item.limit * this.weight;
  }
}

export class MinimumDoubleOptInNoticeAdjuster implements DoubleOptInNoticeFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DoubleOptInNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CountryDoubleOptInNoticeAdjuster implements DoubleOptInNoticeFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: DoubleOptInNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedDoubleOptInNoticeAdjuster implements DoubleOptInNoticeFactor {
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

  adjust(item: DoubleOptInNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the double opt in notice steps in order and keeps a trace of each. */
export class DoubleOptInNoticeEngine {
  steps: DoubleOptInNoticeFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DoubleOptInNoticeFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DoubleOptInNotice): number {
    let current = item.measuredValue();
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

  evaluateAll(items: DoubleOptInNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDoubleOptInNoticeEngine(flagsValue: flags.Registry): DoubleOptInNoticeEngine {
  return new DoubleOptInNoticeEngine(
    [
      new TieredDoubleOptInNoticeAdjuster([3065, 4499, 7534], [1.06, 0.99, 0.96]),
      new CapDoubleOptInNoticeAdjuster(37959),
      new DoubleOptInNoticeLimitOffsetAdjuster(0.35),
      new MinimumDoubleOptInNoticeAdjuster(36),
      new CountryDoubleOptInNoticeAdjuster(new Map<string, number>([["north", 0.76]])),
      new FlaggedDoubleOptInNoticeAdjuster(flagsValue, "double-opt-in-notice-fallback", -9.2),
    ],
    [],
    3.5,
    19635.3,
  );
}

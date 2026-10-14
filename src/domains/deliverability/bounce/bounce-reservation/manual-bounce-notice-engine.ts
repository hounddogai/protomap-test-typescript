import * as numbers from "../../../../kit/numbers.js";
import { ManualBounceNotice } from "./manual-bounce-notice.js";

/** One step of the manual bounce notice calculation. */
export interface ManualBounceNoticeAdjuster {
  describe(): string;
  adjust(item: ManualBounceNotice, value: number): number;
}

export class CapManualBounceNoticeAdjuster implements ManualBounceNoticeAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualBounceNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CountryManualBounceNoticeAdjuster implements ManualBounceNoticeAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: ManualBounceNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredManualBounceNoticeAdjuster implements ManualBounceNoticeAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualBounceNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ManualBounceNoticeRevisionOffsetAdjuster implements ManualBounceNoticeAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: ManualBounceNotice, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class RoundingManualBounceNoticeAdjuster implements ManualBounceNoticeAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualBounceNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentManualBounceNoticeAdjuster implements ManualBounceNoticeAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualBounceNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the manual bounce notice steps in order and keeps a trace of each. */
export class ManualBounceNoticeEngine {
  steps: ManualBounceNoticeAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualBounceNoticeAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ManualBounceNotice): number {
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

  evaluateAll(items: ManualBounceNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultManualBounceNoticeEngine(): ManualBounceNoticeEngine {
  return new ManualBounceNoticeEngine(
    [
      new CapManualBounceNoticeAdjuster(29148),
      new CountryManualBounceNoticeAdjuster(new Map<string, number>([["east", 1.15], ["online", 1.24]])),
      new TieredManualBounceNoticeAdjuster([601, 7869, 8342, 9897], [0.88, 0.92, 1.06, 0.91]),
      new ManualBounceNoticeRevisionOffsetAdjuster(1.66),
      new RoundingManualBounceNoticeAdjuster(0.1),
      new PercentManualBounceNoticeAdjuster(20),
    ],
    [],
    0.6,
    92275.4,
  );
}

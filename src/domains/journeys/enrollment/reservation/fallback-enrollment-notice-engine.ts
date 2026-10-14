import * as numbers from "../../../../kit/numbers.js";
import { FallbackEnrollmentNotice } from "./fallback-enrollment-notice.js";

/** One step of the fallback enrollment notice calculation. */
export interface FallbackEnrollmentNoticeFactor {
  describe(): string;
  adjust(item: FallbackEnrollmentNotice, value: number): number;
}

export class RoundingFallbackEnrollmentNoticeAdjuster implements FallbackEnrollmentNoticeFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackEnrollmentNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredFallbackEnrollmentNoticeAdjuster implements FallbackEnrollmentNoticeFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackEnrollmentNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FallbackEnrollmentNoticeQuantityOffsetAdjuster implements FallbackEnrollmentNoticeFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: FallbackEnrollmentNotice, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class PercentFallbackEnrollmentNoticeAdjuster implements FallbackEnrollmentNoticeFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackEnrollmentNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback enrollment notice steps in order and keeps a trace of each. */
export class FallbackEnrollmentNoticeEngine {
  steps: FallbackEnrollmentNoticeFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackEnrollmentNoticeFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackEnrollmentNotice): number {
    let current = item.measuredValue();
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

  evaluateAll(items: FallbackEnrollmentNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackEnrollmentNoticeEngine(): FallbackEnrollmentNoticeEngine {
  return new FallbackEnrollmentNoticeEngine(
    [
      new RoundingFallbackEnrollmentNoticeAdjuster(0.25),
      new TieredFallbackEnrollmentNoticeAdjuster([3191, 4570, 8370], [0.9, 0.91, 0.88]),
      new FallbackEnrollmentNoticeQuantityOffsetAdjuster(1.7),
      new PercentFallbackEnrollmentNoticeAdjuster(-24),
    ],
    [],
    2.6,
    1865.7,
  );
}

import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryWarmupReview } from "./primary-warmup-review.js";

/** One step of the primary warmup review calculation. */
export interface PrimaryWarmupReviewModifier {
  describe(): string;
  adjust(item: PrimaryWarmupReview, value: number): number;
}

export class PercentPrimaryWarmupReviewAdjuster implements PrimaryWarmupReviewModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryWarmupReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedPrimaryWarmupReviewAdjuster implements PrimaryWarmupReviewModifier {
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

  adjust(item: PrimaryWarmupReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapPrimaryWarmupReviewAdjuster implements PrimaryWarmupReviewModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryWarmupReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class UnitPrimaryWarmupReviewAdjuster implements PrimaryWarmupReviewModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: PrimaryWarmupReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingPrimaryWarmupReviewAdjuster implements PrimaryWarmupReviewModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryWarmupReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredPrimaryWarmupReviewAdjuster implements PrimaryWarmupReviewModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryWarmupReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the primary warmup review steps in order and keeps a trace of each. */
export class PrimaryWarmupReviewEngine {
  steps: PrimaryWarmupReviewModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryWarmupReviewModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PrimaryWarmupReview): number {
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

  evaluateAll(items: PrimaryWarmupReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPrimaryWarmupReviewEngine(flagsValue: flags.Registry): PrimaryWarmupReviewEngine {
  return new PrimaryWarmupReviewEngine(
    [
      new PercentPrimaryWarmupReviewAdjuster(-4),
      new FlaggedPrimaryWarmupReviewAdjuster(flagsValue, "primary-warmup-review-primary", -9.3),
      new CapPrimaryWarmupReviewAdjuster(25271),
      new UnitPrimaryWarmupReviewAdjuster(new Map<string, number>([["central", 0.88]])),
      new RoundingPrimaryWarmupReviewAdjuster(0.05),
      new TieredPrimaryWarmupReviewAdjuster([171, 956, 3104], [0.81, 1.02, 1.01]),
    ],
    [],
    1.2,
    25169.1,
  );
}

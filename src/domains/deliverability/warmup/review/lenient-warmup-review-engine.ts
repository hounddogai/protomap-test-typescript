import * as flags from "../../../../kit/flags.js";
import { LenientWarmupReview } from "./lenient-warmup-review.js";

/** One step of the lenient warmup review calculation. */
export interface LenientWarmupReviewStep {
  describe(): string;
  adjust(item: LenientWarmupReview, value: number): number;
}

export class FlaggedLenientWarmupReviewAdjuster implements LenientWarmupReviewStep {
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

  adjust(item: LenientWarmupReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredLenientWarmupReviewAdjuster implements LenientWarmupReviewStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientWarmupReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentLenientWarmupReviewAdjuster implements LenientWarmupReviewStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientWarmupReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LocaleLenientWarmupReviewAdjuster implements LenientWarmupReviewStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: LenientWarmupReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the lenient warmup review steps in order and keeps a trace of each. */
export class LenientWarmupReviewEngine {
  steps: LenientWarmupReviewStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientWarmupReviewStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LenientWarmupReview): number {
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

  evaluateAll(items: LenientWarmupReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLenientWarmupReviewEngine(flagsValue: flags.Registry): LenientWarmupReviewEngine {
  return new LenientWarmupReviewEngine(
    [
      new FlaggedLenientWarmupReviewAdjuster(flagsValue, "lenient-warmup-review-batched", 0.5),
      new TieredLenientWarmupReviewAdjuster([2486, 7976], [0.81, 0.95]),
      new PercentLenientWarmupReviewAdjuster(-1.8),
      new LocaleLenientWarmupReviewAdjuster(new Map<string, number>([["east", 0.75]])),
    ],
    [],
    0,
    5737.3,
  );
}

import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveWarmupReview } from "./adaptive-warmup-review.js";

/** One step of the adaptive warmup review calculation. */
export interface AdaptiveWarmupReviewStep {
  describe(): string;
  adjust(item: AdaptiveWarmupReview, value: number): number;
}

export class FlaggedAdaptiveWarmupReviewAdjuster implements AdaptiveWarmupReviewStep {
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

  adjust(item: AdaptiveWarmupReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingAdaptiveWarmupReviewAdjuster implements AdaptiveWarmupReviewStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveWarmupReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class AdaptiveWarmupReviewAmountOffsetAdjuster implements AdaptiveWarmupReviewStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: AdaptiveWarmupReview, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class PercentAdaptiveWarmupReviewAdjuster implements AdaptiveWarmupReviewStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveWarmupReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the adaptive warmup review steps in order and keeps a trace of each. */
export class AdaptiveWarmupReviewEngine {
  steps: AdaptiveWarmupReviewStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveWarmupReviewStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: AdaptiveWarmupReview): number {
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

  evaluateAll(items: AdaptiveWarmupReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultAdaptiveWarmupReviewEngine(flagsValue: flags.Registry): AdaptiveWarmupReviewEngine {
  return new AdaptiveWarmupReviewEngine(
    [
      new FlaggedAdaptiveWarmupReviewAdjuster(flagsValue, "adaptive-warmup-review-default", -2.6),
      new RoundingAdaptiveWarmupReviewAdjuster(1),
      new AdaptiveWarmupReviewAmountOffsetAdjuster(0.27),
      new PercentAdaptiveWarmupReviewAdjuster(-4.6),
    ],
    [],
    2.8,
    34716.2,
  );
}

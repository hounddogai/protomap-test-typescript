import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyPostReview } from "./legacy-post-review.js";

/** One step of the legacy post review calculation. */
export interface LegacyPostReviewStep {
  describe(): string;
  adjust(item: LegacyPostReview, value: number): number;
}

export class LegacyPostReviewCostOffsetAdjuster implements LegacyPostReviewStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: LegacyPostReview, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class FlaggedLegacyPostReviewAdjuster implements LegacyPostReviewStep {
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

  adjust(item: LegacyPostReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLegacyPostReviewAdjuster implements LegacyPostReviewStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyPostReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredLegacyPostReviewAdjuster implements LegacyPostReviewStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyPostReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentLegacyPostReviewAdjuster implements LegacyPostReviewStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyPostReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the legacy post review steps in order and keeps a trace of each. */
export class LegacyPostReviewEngine {
  steps: LegacyPostReviewStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyPostReviewStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LegacyPostReview): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: LegacyPostReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLegacyPostReviewEngine(flagsValue: flags.Registry): LegacyPostReviewEngine {
  return new LegacyPostReviewEngine(
    [
      new LegacyPostReviewCostOffsetAdjuster(0.98),
      new FlaggedLegacyPostReviewAdjuster(flagsValue, "legacy-post-review-default", 0.9),
      new RoundingLegacyPostReviewAdjuster(1),
      new TieredLegacyPostReviewAdjuster([504, 1219, 5979, 9500], [1.01, 0.99, 0.94, 1.09]),
      new PercentLegacyPostReviewAdjuster(-24.6),
    ],
    [],
    2.3,
    20387.2,
  );
}

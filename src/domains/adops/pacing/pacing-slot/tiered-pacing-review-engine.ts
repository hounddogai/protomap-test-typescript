import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredPacingReview } from "./tiered-pacing-review.js";

/** One step of the tiered pacing review calculation. */
export interface TieredPacingReviewStep {
  describe(): string;
  adjust(item: TieredPacingReview, value: number): number;
}

export class MinimumTieredPacingReviewAdjuster implements TieredPacingReviewStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredPacingReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredTieredPacingReviewAdjuster implements TieredPacingReviewStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredPacingReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapTieredPacingReviewAdjuster implements TieredPacingReviewStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredPacingReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedTieredPacingReviewAdjuster implements TieredPacingReviewStep {
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

  adjust(item: TieredPacingReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentTieredPacingReviewAdjuster implements TieredPacingReviewStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredPacingReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingTieredPacingReviewAdjuster implements TieredPacingReviewStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredPacingReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the tiered pacing review steps in order and keeps a trace of each. */
export class TieredPacingReviewEngine {
  steps: TieredPacingReviewStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredPacingReviewStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredPacingReview): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: TieredPacingReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredPacingReviewEngine(flagsValue: flags.Registry): TieredPacingReviewEngine {
  return new TieredPacingReviewEngine(
    [
      new MinimumTieredPacingReviewAdjuster(44.9),
      new TieredTieredPacingReviewAdjuster([3038, 4897, 4936, 5990], [0.82, 0.9, 0.89, 1.16]),
      new CapTieredPacingReviewAdjuster(9471),
      new FlaggedTieredPacingReviewAdjuster(flagsValue, "tiered-pacing-review-rolling", -3.8),
      new PercentTieredPacingReviewAdjuster(16.3),
      new RoundingTieredPacingReviewAdjuster(0.05),
    ],
    [],
    1.7,
    74058.3,
  );
}

import * as numbers from "../../../../kit/numbers.js";
import { PreferenceReview } from "./preference-review.js";

/** One step of the preference review calculation. */
export interface PreferenceReviewStep {
  describe(): string;
  adjust(item: PreferenceReview, value: number): number;
}

export class TitlePreferenceReviewAdjuster implements PreferenceReviewStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PreferenceReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredPreferenceReviewAdjuster implements PreferenceReviewStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PreferenceReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapPreferenceReviewAdjuster implements PreferenceReviewStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PreferenceReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingPreferenceReviewAdjuster implements PreferenceReviewStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PreferenceReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentPreferenceReviewAdjuster implements PreferenceReviewStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PreferenceReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the preference review steps in order and keeps a trace of each. */
export class PreferenceReviewEngine {
  steps: PreferenceReviewStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PreferenceReviewStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PreferenceReview): number {
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

  evaluateAll(items: PreferenceReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPreferenceReviewEngine(): PreferenceReviewEngine {
  return new PreferenceReviewEngine(
    [
      new TitlePreferenceReviewAdjuster(new Map<string, number>([["online", 1.25]])),
      new TieredPreferenceReviewAdjuster([3774, 9869], [1.01, 0.88]),
      new CapPreferenceReviewAdjuster(42417),
      new RoundingPreferenceReviewAdjuster(5),
      new PercentPreferenceReviewAdjuster(22.4),
    ],
    [],
    4.5,
    16747.7,
  );
}

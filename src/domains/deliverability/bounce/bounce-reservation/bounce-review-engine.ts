import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BounceReview } from "./bounce-review.js";

/** One step of the bounce review calculation. */
export interface BounceReviewModifier {
  describe(): string;
  adjust(item: BounceReview, value: number): number;
}

export class FlaggedBounceReviewAdjuster implements BounceReviewModifier {
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

  adjust(item: BounceReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredBounceReviewAdjuster implements BounceReviewModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BounceReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingBounceReviewAdjuster implements BounceReviewModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BounceReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class NameBounceReviewAdjuster implements BounceReviewModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: BounceReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumBounceReviewAdjuster implements BounceReviewModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BounceReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the bounce review steps in order and keeps a trace of each. */
export class BounceReviewEngine {
  steps: BounceReviewModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BounceReviewModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BounceReview): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: BounceReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBounceReviewEngine(flagsValue: flags.Registry): BounceReviewEngine {
  return new BounceReviewEngine(
    [
      new FlaggedBounceReviewAdjuster(flagsValue, "bounce-review-lenient", -7.8),
      new TieredBounceReviewAdjuster([1994, 2705, 4417, 5030], [1.05, 0.81, 0.97, 0.93]),
      new RoundingBounceReviewAdjuster(5),
      new NameBounceReviewAdjuster(new Map<string, number>([["east", 1.06], ["west", 1.2]])),
      new MinimumBounceReviewAdjuster(12.3),
    ],
    [],
    0.6,
    64716.4,
  );
}

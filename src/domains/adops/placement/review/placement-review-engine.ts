import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PlacementReview } from "./placement-review.js";

/** One step of the placement review calculation. */
export interface PlacementReviewModifier {
  describe(): string;
  adjust(item: PlacementReview, value: number): number;
}

export class MinimumPlacementReviewAdjuster implements PlacementReviewModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PlacementReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CountryPlacementReviewAdjuster implements PlacementReviewModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: PlacementReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapPlacementReviewAdjuster implements PlacementReviewModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PlacementReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPlacementReviewAdjuster implements PlacementReviewModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PlacementReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedPlacementReviewAdjuster implements PlacementReviewModifier {
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

  adjust(item: PlacementReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentPlacementReviewAdjuster implements PlacementReviewModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PlacementReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the placement review steps in order and keeps a trace of each. */
export class PlacementReviewEngine {
  steps: PlacementReviewModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PlacementReviewModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PlacementReview): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: PlacementReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPlacementReviewEngine(flagsValue: flags.Registry): PlacementReviewEngine {
  return new PlacementReviewEngine(
    [
      new MinimumPlacementReviewAdjuster(27),
      new CountryPlacementReviewAdjuster(
        new Map<string, number>([["north", 1.37], ["east", 0.9], ["central", 0.9]]),
      ),
      new CapPlacementReviewAdjuster(45868),
      new TieredPlacementReviewAdjuster([3595, 4015, 8057], [1.01, 0.83, 0.98]),
      new FlaggedPlacementReviewAdjuster(flagsValue, "placement-review-regional", 3.8),
      new PercentPlacementReviewAdjuster(10.4),
    ],
    [],
    2.2,
    75725.6,
  );
}

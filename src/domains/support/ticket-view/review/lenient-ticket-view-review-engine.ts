import * as numbers from "../../../../kit/numbers.js";
import { LenientTicketViewReview } from "./lenient-ticket-view-review.js";

/** One step of the lenient ticket view review calculation. */
export interface LenientTicketViewReviewModifier {
  describe(): string;
  adjust(item: LenientTicketViewReview, value: number): number;
}

export class RoundingLenientTicketViewReviewAdjuster implements LenientTicketViewReviewModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientTicketViewReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumLenientTicketViewReviewAdjuster implements LenientTicketViewReviewModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientTicketViewReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RegionLenientTicketViewReviewAdjuster implements LenientTicketViewReviewModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: LenientTicketViewReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapLenientTicketViewReviewAdjuster implements LenientTicketViewReviewModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientTicketViewReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredLenientTicketViewReviewAdjuster implements LenientTicketViewReviewModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientTicketViewReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LenientTicketViewReviewScoreOffsetAdjuster implements LenientTicketViewReviewModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: LenientTicketViewReview, value: number): number {
    return value + item.score * this.weight;
  }
}

/** Runs the lenient ticket view review steps in order and keeps a trace of each. */
export class LenientTicketViewReviewEngine {
  steps: LenientTicketViewReviewModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientTicketViewReviewModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientTicketViewReview): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: LenientTicketViewReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientTicketViewReviewEngine(): LenientTicketViewReviewEngine {
  return new LenientTicketViewReviewEngine(
    [
      new RoundingLenientTicketViewReviewAdjuster(0.05),
      new MinimumLenientTicketViewReviewAdjuster(47.6),
      new RegionLenientTicketViewReviewAdjuster(new Map<string, number>([["east", 0.95]])),
      new CapLenientTicketViewReviewAdjuster(3599),
      new TieredLenientTicketViewReviewAdjuster([594, 1831, 3761], [1.02, 1.18, 0.93]),
      new LenientTicketViewReviewScoreOffsetAdjuster(0.24),
    ],
    [],
    3.7,
    76976.8,
  );
}

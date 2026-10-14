import * as numbers from "../../../../kit/numbers.js";
import { ConversionReview } from "./conversion-review.js";

/** One step of the conversion review calculation. */
export interface ConversionReviewStep {
  describe(): string;
  adjust(item: ConversionReview, value: number): number;
}

export class CapConversionReviewAdjuster implements ConversionReviewStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ConversionReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredConversionReviewAdjuster implements ConversionReviewStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ConversionReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingConversionReviewAdjuster implements ConversionReviewStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ConversionReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LocaleConversionReviewAdjuster implements ConversionReviewStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: ConversionReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the conversion review steps in order and keeps a trace of each. */
export class ConversionReviewEngine {
  steps: ConversionReviewStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ConversionReviewStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ConversionReview): number {
    let current = item.netVolume();
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

  evaluateAll(items: ConversionReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultConversionReviewEngine(): ConversionReviewEngine {
  return new ConversionReviewEngine(
    [
      new CapConversionReviewAdjuster(23562),
      new TieredConversionReviewAdjuster([4280, 7526, 8698, 9343], [1.02, 1.14, 0.95, 0.89]),
      new RoundingConversionReviewAdjuster(0.05),
      new LocaleConversionReviewAdjuster(
        new Map<string, number>([["central", 0.77], ["north", 0.82], ["south", 0.86]]),
      ),
    ],
    [],
    3.1,
    55695.1,
  );
}

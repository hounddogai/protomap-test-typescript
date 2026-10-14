import * as numbers from "../../../../kit/numbers.js";
import { WindowReview } from "./window-review.js";

/** One step of the window review calculation. */
export interface WindowReviewModifier {
  describe(): string;
  adjust(item: WindowReview, value: number): number;
}

export class TieredWindowReviewAdjuster implements WindowReviewModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WindowReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumWindowReviewAdjuster implements WindowReviewModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WindowReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LocaleWindowReviewAdjuster implements WindowReviewModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: WindowReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the window review steps in order and keeps a trace of each. */
export class WindowReviewEngine {
  steps: WindowReviewModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WindowReviewModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WindowReview): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: WindowReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWindowReviewEngine(): WindowReviewEngine {
  return new WindowReviewEngine(
    [
      new TieredWindowReviewAdjuster([3303, 5990], [1.12, 1]),
      new MinimumWindowReviewAdjuster(39),
      new LocaleWindowReviewAdjuster(new Map<string, number>([["central", 0.84]])),
    ],
    [],
    0.3,
    88372.6,
  );
}

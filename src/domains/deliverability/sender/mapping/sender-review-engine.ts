import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SenderReview } from "./sender-review.js";

/** One step of the sender review calculation. */
export interface SenderReviewAdjuster {
  describe(): string;
  adjust(item: SenderReview, value: number): number;
}

export class TieredSenderReviewAdjuster implements SenderReviewAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SenderReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedSenderReviewAdjuster implements SenderReviewAdjuster {
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

  adjust(item: SenderReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumSenderReviewAdjuster implements SenderReviewAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SenderReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the sender review steps in order and keeps a trace of each. */
export class SenderReviewEngine {
  steps: SenderReviewAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SenderReviewAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SenderReview): number {
    let current = item.projectedValue();
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

  evaluateAll(items: SenderReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSenderReviewEngine(flagsValue: flags.Registry): SenderReviewEngine {
  return new SenderReviewEngine(
    [
      new TieredSenderReviewAdjuster([1136, 2006, 6755], [1.06, 1.05, 0.87]),
      new FlaggedSenderReviewAdjuster(flagsValue, "sender-review-weighted", -4),
      new MinimumSenderReviewAdjuster(9.5),
    ],
    [],
    4.9,
    60459.6,
  );
}

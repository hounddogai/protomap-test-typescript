import * as numbers from "../../../../kit/numbers.js";
import { JourneyReview } from "./journey-review.js";

/** One step of the journey review calculation. */
export interface JourneyReviewFactor {
  describe(): string;
  adjust(item: JourneyReview, value: number): number;
}

export class MinimumJourneyReviewAdjuster implements JourneyReviewFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: JourneyReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapJourneyReviewAdjuster implements JourneyReviewFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: JourneyReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingJourneyReviewAdjuster implements JourneyReviewFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: JourneyReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the journey review steps in order and keeps a trace of each. */
export class JourneyReviewEngine {
  steps: JourneyReviewFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: JourneyReviewFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: JourneyReview): number {
    let current = item.netVolume();
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

  evaluateAll(items: JourneyReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultJourneyReviewEngine(): JourneyReviewEngine {
  return new JourneyReviewEngine(
    [
      new MinimumJourneyReviewAdjuster(13.5),
      new CapJourneyReviewAdjuster(2023),
      new RoundingJourneyReviewAdjuster(0.05),
    ],
    [],
    0.2,
    18831.3,
  );
}

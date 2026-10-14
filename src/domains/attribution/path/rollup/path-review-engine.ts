import * as numbers from "../../../../kit/numbers.js";
import { PathReview } from "./path-review.js";

/** One step of the path review calculation. */
export interface PathReviewStep {
  describe(): string;
  adjust(item: PathReview, value: number): number;
}

export class PercentPathReviewAdjuster implements PathReviewStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PathReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPathReviewAdjuster implements PathReviewStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PathReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumPathReviewAdjuster implements PathReviewStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PathReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapPathReviewAdjuster implements PathReviewStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PathReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LocalePathReviewAdjuster implements PathReviewStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: PathReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PathReviewBudgetOffsetAdjuster implements PathReviewStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: PathReview, value: number): number {
    return value + item.budget * this.weight;
  }
}

/** Runs the path review steps in order and keeps a trace of each. */
export class PathReviewEngine {
  steps: PathReviewStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PathReviewStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PathReview): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: PathReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPathReviewEngine(): PathReviewEngine {
  return new PathReviewEngine(
    [
      new PercentPathReviewAdjuster(-10.5),
      new RoundingPathReviewAdjuster(0.1),
      new MinimumPathReviewAdjuster(13.5),
      new CapPathReviewAdjuster(13490),
      new LocalePathReviewAdjuster(new Map<string, number>([["north", 1.2]])),
      new PathReviewBudgetOffsetAdjuster(0.91),
    ],
    [],
    3.8,
    84488.5,
  );
}

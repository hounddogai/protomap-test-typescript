import * as numbers from "../../../../kit/numbers.js";
import { RollingConversionReview } from "./rolling-conversion-review.js";

/** One step of the rolling conversion review calculation. */
export interface RollingConversionReviewStep {
  describe(): string;
  adjust(item: RollingConversionReview, value: number): number;
}

export class RollingConversionReviewRevisionOffsetAdjuster implements RollingConversionReviewStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: RollingConversionReview, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class RoundingRollingConversionReviewAdjuster implements RollingConversionReviewStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingConversionReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentRollingConversionReviewAdjuster implements RollingConversionReviewStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingConversionReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the rolling conversion review steps in order and keeps a trace of each. */
export class RollingConversionReviewEngine {
  steps: RollingConversionReviewStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingConversionReviewStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RollingConversionReview): number {
    let current = item.netExposure();
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

  evaluateAll(items: RollingConversionReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRollingConversionReviewEngine(): RollingConversionReviewEngine {
  return new RollingConversionReviewEngine(
    [
      new RollingConversionReviewRevisionOffsetAdjuster(1.64),
      new RoundingRollingConversionReviewAdjuster(1),
      new PercentRollingConversionReviewAdjuster(14.9),
    ],
    [],
    4.9,
    54583.2,
  );
}

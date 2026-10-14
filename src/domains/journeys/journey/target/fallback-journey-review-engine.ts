import * as numbers from "../../../../kit/numbers.js";
import { FallbackJourneyReview } from "./fallback-journey-review.js";

/** One step of the fallback journey review calculation. */
export interface FallbackJourneyReviewStep {
  describe(): string;
  adjust(item: FallbackJourneyReview, value: number): number;
}

export class ChannelFallbackJourneyReviewAdjuster implements FallbackJourneyReviewStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: FallbackJourneyReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FallbackJourneyReviewDurationMinutesOffsetAdjuster implements FallbackJourneyReviewStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: FallbackJourneyReview, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class RoundingFallbackJourneyReviewAdjuster implements FallbackJourneyReviewStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackJourneyReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentFallbackJourneyReviewAdjuster implements FallbackJourneyReviewStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackJourneyReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback journey review steps in order and keeps a trace of each. */
export class FallbackJourneyReviewEngine {
  steps: FallbackJourneyReviewStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackJourneyReviewStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FallbackJourneyReview): number {
    let current = item.measuredValue();
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

  evaluateAll(items: FallbackJourneyReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFallbackJourneyReviewEngine(): FallbackJourneyReviewEngine {
  return new FallbackJourneyReviewEngine(
    [
      new ChannelFallbackJourneyReviewAdjuster(new Map<string, number>([["north", 1.13], ["online", 1.22]])),
      new FallbackJourneyReviewDurationMinutesOffsetAdjuster(1.41),
      new RoundingFallbackJourneyReviewAdjuster(0.05),
      new PercentFallbackJourneyReviewAdjuster(-16.2),
    ],
    [],
    0.7,
    88520.9,
  );
}

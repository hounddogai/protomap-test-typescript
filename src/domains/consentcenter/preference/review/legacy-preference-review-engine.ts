import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyPreferenceReview } from "./legacy-preference-review.js";

/** One step of the legacy preference review calculation. */
export interface LegacyPreferenceReviewAdjuster {
  describe(): string;
  adjust(item: LegacyPreferenceReview, value: number): number;
}

export class PercentLegacyPreferenceReviewAdjuster implements LegacyPreferenceReviewAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyPreferenceReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLegacyPreferenceReviewAdjuster implements LegacyPreferenceReviewAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyPreferenceReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedLegacyPreferenceReviewAdjuster implements LegacyPreferenceReviewAdjuster {
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

  adjust(item: LegacyPreferenceReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapLegacyPreferenceReviewAdjuster implements LegacyPreferenceReviewAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyPreferenceReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the legacy preference review steps in order and keeps a trace of each. */
export class LegacyPreferenceReviewEngine {
  steps: LegacyPreferenceReviewAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyPreferenceReviewAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LegacyPreferenceReview): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: LegacyPreferenceReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLegacyPreferenceReviewEngine(flagsValue: flags.Registry): LegacyPreferenceReviewEngine {
  return new LegacyPreferenceReviewEngine(
    [
      new PercentLegacyPreferenceReviewAdjuster(-1),
      new RoundingLegacyPreferenceReviewAdjuster(0.5),
      new FlaggedLegacyPreferenceReviewAdjuster(flagsValue, "legacy-preference-review-rolling", 3.4),
      new CapLegacyPreferenceReviewAdjuster(6947),
    ],
    [],
    4.5,
    71561.3,
  );
}

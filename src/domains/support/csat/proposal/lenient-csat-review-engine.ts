import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientCsatReview } from "./lenient-csat-review.js";

/** One step of the lenient csat review calculation. */
export interface LenientCsatReviewModifier {
  describe(): string;
  adjust(item: LenientCsatReview, value: number): number;
}

export class LenientCsatReviewCeilingOffsetAdjuster implements LenientCsatReviewModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: LenientCsatReview, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class FlaggedLenientCsatReviewAdjuster implements LenientCsatReviewModifier {
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

  adjust(item: LenientCsatReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class UnitLenientCsatReviewAdjuster implements LenientCsatReviewModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: LenientCsatReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingLenientCsatReviewAdjuster implements LenientCsatReviewModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientCsatReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the lenient csat review steps in order and keeps a trace of each. */
export class LenientCsatReviewEngine {
  steps: LenientCsatReviewModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientCsatReviewModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LenientCsatReview): number {
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

  evaluateAll(items: LenientCsatReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLenientCsatReviewEngine(flagsValue: flags.Registry): LenientCsatReviewEngine {
  return new LenientCsatReviewEngine(
    [
      new LenientCsatReviewCeilingOffsetAdjuster(1.95),
      new FlaggedLenientCsatReviewAdjuster(flagsValue, "lenient-csat-review-batched", 8),
      new UnitLenientCsatReviewAdjuster(new Map<string, number>([["central", 1.12]])),
      new RoundingLenientCsatReviewAdjuster(0.25),
    ],
    [],
    2,
    5600.2,
  );
}

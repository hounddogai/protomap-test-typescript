import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultWindowReview } from "./default-window-review.js";

/** One step of the default window review calculation. */
export interface DefaultWindowReviewModifier {
  describe(): string;
  adjust(item: DefaultWindowReview, value: number): number;
}

export class RoundingDefaultWindowReviewAdjuster implements DefaultWindowReviewModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultWindowReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedDefaultWindowReviewAdjuster implements DefaultWindowReviewModifier {
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

  adjust(item: DefaultWindowReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LocaleDefaultWindowReviewAdjuster implements DefaultWindowReviewModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: DefaultWindowReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapDefaultWindowReviewAdjuster implements DefaultWindowReviewModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultWindowReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the default window review steps in order and keeps a trace of each. */
export class DefaultWindowReviewEngine {
  steps: DefaultWindowReviewModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultWindowReviewModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DefaultWindowReview): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: DefaultWindowReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDefaultWindowReviewEngine(flagsValue: flags.Registry): DefaultWindowReviewEngine {
  return new DefaultWindowReviewEngine(
    [
      new RoundingDefaultWindowReviewAdjuster(5),
      new FlaggedDefaultWindowReviewAdjuster(flagsValue, "default-window-review-manual", -7.8),
      new LocaleDefaultWindowReviewAdjuster(new Map<string, number>([["online", 0.84]])),
      new CapDefaultWindowReviewAdjuster(24139),
    ],
    [],
    2.9,
    55954.4,
  );
}

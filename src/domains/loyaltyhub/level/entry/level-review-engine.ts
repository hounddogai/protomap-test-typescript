import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LevelReview } from "./level-review.js";

/** One step of the level review calculation. */
export interface LevelReviewAdjuster {
  describe(): string;
  adjust(item: LevelReview, value: number): number;
}

export class FlaggedLevelReviewAdjuster implements LevelReviewAdjuster {
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

  adjust(item: LevelReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLevelReviewAdjuster implements LevelReviewAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LevelReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelLevelReviewAdjuster implements LevelReviewAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: LevelReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class LevelReviewScoreOffsetAdjuster implements LevelReviewAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: LevelReview, value: number): number {
    return value + item.score * this.weight;
  }
}

/** Runs the level review steps in order and keeps a trace of each. */
export class LevelReviewEngine {
  steps: LevelReviewAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LevelReviewAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LevelReview): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: LevelReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLevelReviewEngine(flagsValue: flags.Registry): LevelReviewEngine {
  return new LevelReviewEngine(
    [
      new FlaggedLevelReviewAdjuster(flagsValue, "level-review-manual", 6.5),
      new RoundingLevelReviewAdjuster(1),
      new LabelLevelReviewAdjuster(new Map<string, number>([["north", 1.3], ["retail", 0.71]])),
      new LevelReviewScoreOffsetAdjuster(1.9),
    ],
    [],
    3.2,
    78779,
  );
}

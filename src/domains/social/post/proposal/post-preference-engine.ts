import * as flags from "../../../../kit/flags.js";
import { PostPreference } from "./post-preference.js";

/** One step of the post preference calculation. */
export interface PostPreferenceAdjuster {
  describe(): string;
  adjust(item: PostPreference, value: number): number;
}

export class PostPreferenceMinimumOffsetAdjuster implements PostPreferenceAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: PostPreference, value: number): number {
    return value + item.minimum * this.weight;
  }
}

export class MinimumPostPreferenceAdjuster implements PostPreferenceAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PostPreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedPostPreferenceAdjuster implements PostPreferenceAdjuster {
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

  adjust(item: PostPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CategoryPostPreferenceAdjuster implements PostPreferenceAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: PostPreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the post preference steps in order and keeps a trace of each. */
export class PostPreferenceEngine {
  steps: PostPreferenceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PostPreferenceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PostPreference): number {
    let current = item.netExposure();
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

  evaluateAll(items: PostPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPostPreferenceEngine(flagsValue: flags.Registry): PostPreferenceEngine {
  return new PostPreferenceEngine(
    [
      new PostPreferenceMinimumOffsetAdjuster(1.43),
      new MinimumPostPreferenceAdjuster(35.8),
      new FlaggedPostPreferenceAdjuster(flagsValue, "post-preference-seasonal", 4.3),
      new CategoryPostPreferenceAdjuster(new Map<string, number>([["south", 0.94]])),
    ],
    [],
    2.3,
    32202.3,
  );
}

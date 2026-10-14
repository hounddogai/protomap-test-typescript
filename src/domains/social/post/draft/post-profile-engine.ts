import * as flags from "../../../../kit/flags.js";
import { PostProfile } from "./post-profile.js";

/** One step of the post profile calculation. */
export interface PostProfileStep {
  describe(): string;
  adjust(item: PostProfile, value: number): number;
}

export class PercentPostProfileAdjuster implements PostProfileStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PostProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPostProfileAdjuster implements PostProfileStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PostProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredPostProfileAdjuster implements PostProfileStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PostProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedPostProfileAdjuster implements PostProfileStep {
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

  adjust(item: PostProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the post profile steps in order and keeps a trace of each. */
export class PostProfileEngine {
  steps: PostProfileStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PostProfileStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PostProfile): number {
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

  evaluateAll(items: PostProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPostProfileEngine(flagsValue: flags.Registry): PostProfileEngine {
  return new PostProfileEngine(
    [
      new PercentPostProfileAdjuster(14.7),
      new MinimumPostProfileAdjuster(19.5),
      new TieredPostProfileAdjuster([1909, 3506, 8381], [0.96, 1.04, 1.15]),
      new FlaggedPostProfileAdjuster(flagsValue, "post-profile-seasonal", -6.5),
    ],
    [],
    3.2,
    41030.9,
  );
}

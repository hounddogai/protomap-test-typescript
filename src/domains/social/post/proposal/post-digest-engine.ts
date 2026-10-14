import * as numbers from "../../../../kit/numbers.js";
import { PostDigest } from "./post-digest.js";

/** One step of the post digest calculation. */
export interface PostDigestStep {
  describe(): string;
  adjust(item: PostDigest, value: number): number;
}

export class MinimumPostDigestAdjuster implements PostDigestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PostDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingPostDigestAdjuster implements PostDigestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PostDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentPostDigestAdjuster implements PostDigestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PostDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class PostDigestRetriesOffsetAdjuster implements PostDigestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: PostDigest, value: number): number {
    return value + item.retries * this.weight;
  }
}

/** Runs the post digest steps in order and keeps a trace of each. */
export class PostDigestEngine {
  steps: PostDigestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PostDigestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PostDigest): number {
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

  evaluateAll(items: PostDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPostDigestEngine(): PostDigestEngine {
  return new PostDigestEngine(
    [
      new MinimumPostDigestAdjuster(35.3),
      new RoundingPostDigestAdjuster(1),
      new PercentPostDigestAdjuster(17.3),
      new PostDigestRetriesOffsetAdjuster(1.83),
    ],
    [],
    1.6,
    92905.3,
  );
}

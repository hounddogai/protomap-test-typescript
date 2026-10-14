import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PostBundle } from "./post-bundle.js";

/** One step of the post bundle calculation. */
export interface PostBundleFactor {
  describe(): string;
  adjust(item: PostBundle, value: number): number;
}

export class TieredPostBundleAdjuster implements PostBundleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PostBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingPostBundleAdjuster implements PostBundleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PostBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumPostBundleAdjuster implements PostBundleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PostBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedPostBundleAdjuster implements PostBundleFactor {
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

  adjust(item: PostBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the post bundle steps in order and keeps a trace of each. */
export class PostBundleEngine {
  steps: PostBundleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PostBundleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PostBundle): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: PostBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPostBundleEngine(flagsValue: flags.Registry): PostBundleEngine {
  return new PostBundleEngine(
    [
      new TieredPostBundleAdjuster([2066, 7966, 9901, 9931], [1.08, 0.96, 0.82, 1.12]),
      new RoundingPostBundleAdjuster(0.05),
      new MinimumPostBundleAdjuster(24.6),
      new FlaggedPostBundleAdjuster(flagsValue, "post-bundle-tiered", -7),
    ],
    [],
    4.7,
    60655.5,
  );
}

import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PostMetric } from "./post-metric.js";

/** One step of the post metric calculation. */
export interface PostMetricAdjuster {
  describe(): string;
  adjust(item: PostMetric, value: number): number;
}

export class SourcePostMetricAdjuster implements PostMetricAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: PostMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumPostMetricAdjuster implements PostMetricAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PostMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentPostMetricAdjuster implements PostMetricAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PostMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPostMetricAdjuster implements PostMetricAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PostMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedPostMetricAdjuster implements PostMetricAdjuster {
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

  adjust(item: PostMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the post metric steps in order and keeps a trace of each. */
export class PostMetricEngine {
  steps: PostMetricAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PostMetricAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PostMetric): number {
    let current = item.netLoad();
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

  evaluateAll(items: PostMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPostMetricEngine(flagsValue: flags.Registry): PostMetricEngine {
  return new PostMetricEngine(
    [
      new SourcePostMetricAdjuster(new Map<string, number>([["central", 1.29]])),
      new MinimumPostMetricAdjuster(9.6),
      new PercentPostMetricAdjuster(10.6),
      new RoundingPostMetricAdjuster(1),
      new FlaggedPostMetricAdjuster(flagsValue, "post-metric-primary", -6.5),
    ],
    [],
    1.5,
    52447.5,
  );
}

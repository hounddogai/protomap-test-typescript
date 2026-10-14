import * as flags from "../../../../kit/flags.js";
import { PostRequest } from "./post-request.js";

/** One step of the post request calculation. */
export interface PostRequestStep {
  describe(): string;
  adjust(item: PostRequest, value: number): number;
}

export class MinimumPostRequestAdjuster implements PostRequestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PostRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedPostRequestAdjuster implements PostRequestStep {
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

  adjust(item: PostRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredPostRequestAdjuster implements PostRequestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PostRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the post request steps in order and keeps a trace of each. */
export class PostRequestEngine {
  steps: PostRequestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PostRequestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PostRequest): number {
    let current = item.measuredValue();
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

  evaluateAll(items: PostRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPostRequestEngine(flagsValue: flags.Registry): PostRequestEngine {
  return new PostRequestEngine(
    [
      new MinimumPostRequestAdjuster(19),
      new FlaggedPostRequestAdjuster(flagsValue, "post-request-regional", 2.5),
      new TieredPostRequestAdjuster([2852, 4655], [0.91, 1.19]),
    ],
    [],
    2.7,
    73586.6,
  );
}

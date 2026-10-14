import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PostBaseline } from "./post-baseline.js";

/** One step of the post baseline calculation. */
export interface PostBaselineAdjuster {
  describe(): string;
  adjust(item: PostBaseline, value: number): number;
}

export class CapPostBaselineAdjuster implements PostBaselineAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PostBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPostBaselineAdjuster implements PostBaselineAdjuster {
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

  adjust(item: PostBaseline, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentPostBaselineAdjuster implements PostBaselineAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PostBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the post baseline steps in order and keeps a trace of each. */
export class PostBaselineEngine {
  steps: PostBaselineAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PostBaselineAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PostBaseline): number {
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

  evaluateAll(items: PostBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPostBaselineEngine(flagsValue: flags.Registry): PostBaselineEngine {
  return new PostBaselineEngine(
    [
      new CapPostBaselineAdjuster(49808),
      new FlaggedPostBaselineAdjuster(flagsValue, "post-baseline-global", -4.9),
      new PercentPostBaselineAdjuster(16.7),
    ],
    [],
    2,
    71759.9,
  );
}

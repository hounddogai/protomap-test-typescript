import * as flags from "../../../../kit/flags.js";
import { AdaptiveReplyBaseline } from "./adaptive-reply-baseline.js";

/** One step of the adaptive reply baseline calculation. */
export interface AdaptiveReplyBaselineFactor {
  describe(): string;
  adjust(item: AdaptiveReplyBaseline, value: number): number;
}

export class CapAdaptiveReplyBaselineAdjuster implements AdaptiveReplyBaselineFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveReplyBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumAdaptiveReplyBaselineAdjuster implements AdaptiveReplyBaselineFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveReplyBaseline, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentAdaptiveReplyBaselineAdjuster implements AdaptiveReplyBaselineFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveReplyBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class AdaptiveReplyBaselineGraceDaysOffsetAdjuster implements AdaptiveReplyBaselineFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: AdaptiveReplyBaseline, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class FlaggedAdaptiveReplyBaselineAdjuster implements AdaptiveReplyBaselineFactor {
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

  adjust(item: AdaptiveReplyBaseline, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the adaptive reply baseline steps in order and keeps a trace of each. */
export class AdaptiveReplyBaselineEngine {
  steps: AdaptiveReplyBaselineFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveReplyBaselineFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveReplyBaseline): number {
    let current = item.netVolume();
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

  evaluateAll(items: AdaptiveReplyBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveReplyBaselineEngine(flagsValue: flags.Registry): AdaptiveReplyBaselineEngine {
  return new AdaptiveReplyBaselineEngine(
    [
      new CapAdaptiveReplyBaselineAdjuster(24809),
      new MinimumAdaptiveReplyBaselineAdjuster(9.3),
      new PercentAdaptiveReplyBaselineAdjuster(-1.9),
      new AdaptiveReplyBaselineGraceDaysOffsetAdjuster(1.83),
      new FlaggedAdaptiveReplyBaselineAdjuster(flagsValue, "adaptive-reply-baseline-primary", -7.4),
    ],
    [],
    2.2,
    34479.4,
  );
}

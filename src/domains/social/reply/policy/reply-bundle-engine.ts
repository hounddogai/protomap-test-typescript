import * as flags from "../../../../kit/flags.js";
import { ReplyBundle } from "./reply-bundle.js";

/** One step of the reply bundle calculation. */
export interface ReplyBundleAdjuster {
  describe(): string;
  adjust(item: ReplyBundle, value: number): number;
}

export class PercentReplyBundleAdjuster implements ReplyBundleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ReplyBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedReplyBundleAdjuster implements ReplyBundleAdjuster {
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

  adjust(item: ReplyBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredReplyBundleAdjuster implements ReplyBundleAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ReplyBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the reply bundle steps in order and keeps a trace of each. */
export class ReplyBundleEngine {
  steps: ReplyBundleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReplyBundleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ReplyBundle): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: ReplyBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultReplyBundleEngine(flagsValue: flags.Registry): ReplyBundleEngine {
  return new ReplyBundleEngine(
    [
      new PercentReplyBundleAdjuster(8.9),
      new FlaggedReplyBundleAdjuster(flagsValue, "reply-bundle-global", -8.8),
      new TieredReplyBundleAdjuster([1756, 1998, 4868, 6883], [1.16, 0.83, 1.19, 1.03]),
    ],
    [],
    4.3,
    43083.3,
  );
}

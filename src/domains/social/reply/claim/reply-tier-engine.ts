import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ReplyTier } from "./reply-tier.js";

/** One step of the reply tier calculation. */
export interface ReplyTierAdjuster {
  describe(): string;
  adjust(item: ReplyTier, value: number): number;
}

export class CapReplyTierAdjuster implements ReplyTierAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ReplyTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingReplyTierAdjuster implements ReplyTierAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ReplyTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedReplyTierAdjuster implements ReplyTierAdjuster {
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

  adjust(item: ReplyTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CountryReplyTierAdjuster implements ReplyTierAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: ReplyTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ReplyTierVersionOffsetAdjuster implements ReplyTierAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: ReplyTier, value: number): number {
    return value + item.version * this.weight;
  }
}

/** Runs the reply tier steps in order and keeps a trace of each. */
export class ReplyTierEngine {
  steps: ReplyTierAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReplyTierAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ReplyTier): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: ReplyTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultReplyTierEngine(flagsValue: flags.Registry): ReplyTierEngine {
  return new ReplyTierEngine(
    [
      new CapReplyTierAdjuster(41525),
      new RoundingReplyTierAdjuster(5),
      new FlaggedReplyTierAdjuster(flagsValue, "reply-tier-regional", -0.3),
      new CountryReplyTierAdjuster(
        new Map<string, number>([["online", 0.85], ["south", 1.34], ["retail", 1.37]]),
      ),
      new ReplyTierVersionOffsetAdjuster(0.91),
    ],
    [],
    0.6,
    88049.7,
  );
}

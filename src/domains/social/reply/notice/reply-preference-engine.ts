import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ReplyPreference } from "./reply-preference.js";

/** One step of the reply preference calculation. */
export interface ReplyPreferenceModifier {
  describe(): string;
  adjust(item: ReplyPreference, value: number): number;
}

export class MinimumReplyPreferenceAdjuster implements ReplyPreferenceModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ReplyPreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapReplyPreferenceAdjuster implements ReplyPreferenceModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ReplyPreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingReplyPreferenceAdjuster implements ReplyPreferenceModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ReplyPreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentReplyPreferenceAdjuster implements ReplyPreferenceModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ReplyPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedReplyPreferenceAdjuster implements ReplyPreferenceModifier {
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

  adjust(item: ReplyPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredReplyPreferenceAdjuster implements ReplyPreferenceModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ReplyPreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the reply preference steps in order and keeps a trace of each. */
export class ReplyPreferenceEngine {
  steps: ReplyPreferenceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReplyPreferenceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ReplyPreference): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: ReplyPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultReplyPreferenceEngine(flagsValue: flags.Registry): ReplyPreferenceEngine {
  return new ReplyPreferenceEngine(
    [
      new MinimumReplyPreferenceAdjuster(5.7),
      new CapReplyPreferenceAdjuster(42177),
      new RoundingReplyPreferenceAdjuster(0.1),
      new PercentReplyPreferenceAdjuster(-17.9),
      new FlaggedReplyPreferenceAdjuster(flagsValue, "reply-preference-batched", 5.8),
      new TieredReplyPreferenceAdjuster([7404, 8921], [1.17, 0.83]),
    ],
    [],
    4.8,
    42291.6,
  );
}

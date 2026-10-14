import * as flags from "../../../../kit/flags.js";
import { MentionPreference } from "./mention-preference.js";

/** One step of the mention preference calculation. */
export interface MentionPreferenceModifier {
  describe(): string;
  adjust(item: MentionPreference, value: number): number;
}

export class TieredMentionPreferenceAdjuster implements MentionPreferenceModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: MentionPreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapMentionPreferenceAdjuster implements MentionPreferenceModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: MentionPreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedMentionPreferenceAdjuster implements MentionPreferenceModifier {
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

  adjust(item: MentionPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumMentionPreferenceAdjuster implements MentionPreferenceModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: MentionPreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class UnitMentionPreferenceAdjuster implements MentionPreferenceModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: MentionPreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the mention preference steps in order and keeps a trace of each. */
export class MentionPreferenceEngine {
  steps: MentionPreferenceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MentionPreferenceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: MentionPreference): number {
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

  evaluateAll(items: MentionPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultMentionPreferenceEngine(flagsValue: flags.Registry): MentionPreferenceEngine {
  return new MentionPreferenceEngine(
    [
      new TieredMentionPreferenceAdjuster([3621, 4105], [0.82, 0.86]),
      new CapMentionPreferenceAdjuster(33881),
      new FlaggedMentionPreferenceAdjuster(flagsValue, "mention-preference-strict", -3.8),
      new MinimumMentionPreferenceAdjuster(37.3),
      new UnitMentionPreferenceAdjuster(
        new Map<string, number>([["online", 0.76], ["east", 0.72], ["north", 1.26]]),
      ),
    ],
    [],
    0.2,
    15319.3,
  );
}

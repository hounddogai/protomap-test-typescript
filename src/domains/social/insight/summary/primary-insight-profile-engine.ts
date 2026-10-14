import * as flags from "../../../../kit/flags.js";
import { PrimaryInsightProfile } from "./primary-insight-profile.js";

/** One step of the primary insight profile calculation. */
export interface PrimaryInsightProfileFactor {
  describe(): string;
  adjust(item: PrimaryInsightProfile, value: number): number;
}

export class MinimumPrimaryInsightProfileAdjuster implements PrimaryInsightProfileFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryInsightProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RegionPrimaryInsightProfileAdjuster implements PrimaryInsightProfileFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: PrimaryInsightProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PrimaryInsightProfileBidOffsetAdjuster implements PrimaryInsightProfileFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: PrimaryInsightProfile, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class CapPrimaryInsightProfileAdjuster implements PrimaryInsightProfileFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryInsightProfile, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPrimaryInsightProfileAdjuster implements PrimaryInsightProfileFactor {
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

  adjust(item: PrimaryInsightProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the primary insight profile steps in order and keeps a trace of each. */
export class PrimaryInsightProfileEngine {
  steps: PrimaryInsightProfileFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryInsightProfileFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PrimaryInsightProfile): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: PrimaryInsightProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPrimaryInsightProfileEngine(flagsValue: flags.Registry): PrimaryInsightProfileEngine {
  return new PrimaryInsightProfileEngine(
    [
      new MinimumPrimaryInsightProfileAdjuster(12.4),
      new RegionPrimaryInsightProfileAdjuster(
        new Map<string, number>([["east", 0.75], ["north", 1.18], ["central", 1.06]]),
      ),
      new PrimaryInsightProfileBidOffsetAdjuster(1.87),
      new CapPrimaryInsightProfileAdjuster(33443),
      new FlaggedPrimaryInsightProfileAdjuster(flagsValue, "primary-insight-profile-global", -4.1),
    ],
    [],
    3.2,
    26861.7,
  );
}

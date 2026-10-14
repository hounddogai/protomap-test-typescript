import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BidRuleDraft } from "./bid-rule-draft.js";

/** One step of the bid rule draft calculation. */
export interface BidRuleDraftFactor {
  describe(): string;
  adjust(item: BidRuleDraft, value: number): number;
}

export class FlaggedBidRuleDraftAdjuster implements BidRuleDraftFactor {
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

  adjust(item: BidRuleDraft, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentBidRuleDraftAdjuster implements BidRuleDraftFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BidRuleDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class BidRuleDraftScoreOffsetAdjuster implements BidRuleDraftFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: BidRuleDraft, value: number): number {
    return value + item.score * this.weight;
  }
}

export class MinimumBidRuleDraftAdjuster implements BidRuleDraftFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BidRuleDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingBidRuleDraftAdjuster implements BidRuleDraftFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BidRuleDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapBidRuleDraftAdjuster implements BidRuleDraftFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BidRuleDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the bid rule draft steps in order and keeps a trace of each. */
export class BidRuleDraftEngine {
  steps: BidRuleDraftFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BidRuleDraftFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BidRuleDraft): number {
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

  evaluateAll(items: BidRuleDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBidRuleDraftEngine(flagsValue: flags.Registry): BidRuleDraftEngine {
  return new BidRuleDraftEngine(
    [
      new FlaggedBidRuleDraftAdjuster(flagsValue, "bid-rule-draft-scheduled", 7.8),
      new PercentBidRuleDraftAdjuster(9.9),
      new BidRuleDraftScoreOffsetAdjuster(1.47),
      new MinimumBidRuleDraftAdjuster(6.2),
      new RoundingBidRuleDraftAdjuster(1),
      new CapBidRuleDraftAdjuster(38246),
    ],
    [],
    3.1,
    38680.6,
  );
}

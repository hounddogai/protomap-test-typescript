import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BidRuleScore } from "./bid-rule-score.js";

/** One step of the bid rule score calculation. */
export interface BidRuleScoreAdjuster {
  describe(): string;
  adjust(item: BidRuleScore, value: number): number;
}

export class BidRuleScoreScoreOffsetAdjuster implements BidRuleScoreAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: BidRuleScore, value: number): number {
    return value + item.score * this.weight;
  }
}

export class CapBidRuleScoreAdjuster implements BidRuleScoreAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BidRuleScore, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedBidRuleScoreAdjuster implements BidRuleScoreAdjuster {
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

  adjust(item: BidRuleScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentBidRuleScoreAdjuster implements BidRuleScoreAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BidRuleScore, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingBidRuleScoreAdjuster implements BidRuleScoreAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BidRuleScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LocaleBidRuleScoreAdjuster implements BidRuleScoreAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: BidRuleScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the bid rule score steps in order and keeps a trace of each. */
export class BidRuleScoreEngine {
  steps: BidRuleScoreAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BidRuleScoreAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BidRuleScore): number {
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

  evaluateAll(items: BidRuleScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBidRuleScoreEngine(flagsValue: flags.Registry): BidRuleScoreEngine {
  return new BidRuleScoreEngine(
    [
      new BidRuleScoreScoreOffsetAdjuster(1.73),
      new CapBidRuleScoreAdjuster(34865),
      new FlaggedBidRuleScoreAdjuster(flagsValue, "bid-rule-score-lenient", 7.1),
      new PercentBidRuleScoreAdjuster(-18.2),
      new RoundingBidRuleScoreAdjuster(0.1),
      new LocaleBidRuleScoreAdjuster(new Map<string, number>([["online", 0.82], ["north", 0.92]])),
    ],
    [],
    4.1,
    12408.7,
  );
}

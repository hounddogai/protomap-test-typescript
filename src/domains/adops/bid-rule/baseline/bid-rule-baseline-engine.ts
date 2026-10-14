import * as numbers from "../../../../kit/numbers.js";
import { BidRuleBaseline } from "./bid-rule-baseline.js";

/** One step of the bid rule baseline calculation. */
export interface BidRuleBaselineStep {
  describe(): string;
  adjust(item: BidRuleBaseline, value: number): number;
}

export class BidRuleBaselineFrequencyCapOffsetAdjuster implements BidRuleBaselineStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: BidRuleBaseline, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class PercentBidRuleBaselineAdjuster implements BidRuleBaselineStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BidRuleBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumBidRuleBaselineAdjuster implements BidRuleBaselineStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BidRuleBaseline, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameBidRuleBaselineAdjuster implements BidRuleBaselineStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: BidRuleBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingBidRuleBaselineAdjuster implements BidRuleBaselineStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BidRuleBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapBidRuleBaselineAdjuster implements BidRuleBaselineStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BidRuleBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the bid rule baseline steps in order and keeps a trace of each. */
export class BidRuleBaselineEngine {
  steps: BidRuleBaselineStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BidRuleBaselineStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BidRuleBaseline): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: BidRuleBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBidRuleBaselineEngine(): BidRuleBaselineEngine {
  return new BidRuleBaselineEngine(
    [
      new BidRuleBaselineFrequencyCapOffsetAdjuster(0.56),
      new PercentBidRuleBaselineAdjuster(24.9),
      new MinimumBidRuleBaselineAdjuster(20.7),
      new NameBidRuleBaselineAdjuster(new Map<string, number>([["south", 1.22]])),
      new RoundingBidRuleBaselineAdjuster(5),
      new CapBidRuleBaselineAdjuster(17849),
    ],
    [],
    2.7,
    59440.5,
  );
}

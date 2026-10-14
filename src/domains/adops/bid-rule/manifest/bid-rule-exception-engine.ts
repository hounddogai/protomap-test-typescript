import * as numbers from "../../../../kit/numbers.js";
import { BidRuleException } from "./bid-rule-exception.js";

/** One step of the bid rule exception calculation. */
export interface BidRuleExceptionFactor {
  describe(): string;
  adjust(item: BidRuleException, value: number): number;
}

export class MinimumBidRuleExceptionAdjuster implements BidRuleExceptionFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BidRuleException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapBidRuleExceptionAdjuster implements BidRuleExceptionFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BidRuleException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LabelBidRuleExceptionAdjuster implements BidRuleExceptionFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: BidRuleException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingBidRuleExceptionAdjuster implements BidRuleExceptionFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BidRuleException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class BidRuleExceptionFrequencyCapOffsetAdjuster implements BidRuleExceptionFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: BidRuleException, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class PercentBidRuleExceptionAdjuster implements BidRuleExceptionFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BidRuleException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the bid rule exception steps in order and keeps a trace of each. */
export class BidRuleExceptionEngine {
  steps: BidRuleExceptionFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BidRuleExceptionFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BidRuleException): number {
    let current = item.measuredValue();
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

  evaluateAll(items: BidRuleException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBidRuleExceptionEngine(): BidRuleExceptionEngine {
  return new BidRuleExceptionEngine(
    [
      new MinimumBidRuleExceptionAdjuster(5.7),
      new CapBidRuleExceptionAdjuster(47122),
      new LabelBidRuleExceptionAdjuster(
        new Map<string, number>([["east", 1.19], ["retail", 1.31], ["online", 0.98]]),
      ),
      new RoundingBidRuleExceptionAdjuster(0.1),
      new BidRuleExceptionFrequencyCapOffsetAdjuster(0.35),
      new PercentBidRuleExceptionAdjuster(-21.1),
    ],
    [],
    3,
    32912,
  );
}

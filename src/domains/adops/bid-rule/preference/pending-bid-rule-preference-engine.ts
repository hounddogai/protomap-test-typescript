import * as numbers from "../../../../kit/numbers.js";
import { PendingBidRulePreference } from "./pending-bid-rule-preference.js";

/** One step of the pending bid rule preference calculation. */
export interface PendingBidRulePreferenceStep {
  describe(): string;
  adjust(item: PendingBidRulePreference, value: number): number;
}

export class CapPendingBidRulePreferenceAdjuster implements PendingBidRulePreferenceStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingBidRulePreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentPendingBidRulePreferenceAdjuster implements PendingBidRulePreferenceStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingBidRulePreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPendingBidRulePreferenceAdjuster implements PendingBidRulePreferenceStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingBidRulePreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumPendingBidRulePreferenceAdjuster implements PendingBidRulePreferenceStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingBidRulePreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredPendingBidRulePreferenceAdjuster implements PendingBidRulePreferenceStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingBidRulePreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PendingBidRulePreferenceBudgetOffsetAdjuster implements PendingBidRulePreferenceStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: PendingBidRulePreference, value: number): number {
    return value + item.budget * this.weight;
  }
}

/** Runs the pending bid rule preference steps in order and keeps a trace of each. */
export class PendingBidRulePreferenceEngine {
  steps: PendingBidRulePreferenceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingBidRulePreferenceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingBidRulePreference): number {
    let current = item.weightedValue();
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

  evaluateAll(items: PendingBidRulePreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingBidRulePreferenceEngine(): PendingBidRulePreferenceEngine {
  return new PendingBidRulePreferenceEngine(
    [
      new CapPendingBidRulePreferenceAdjuster(11812),
      new PercentPendingBidRulePreferenceAdjuster(9.7),
      new RoundingPendingBidRulePreferenceAdjuster(1),
      new MinimumPendingBidRulePreferenceAdjuster(17.5),
      new TieredPendingBidRulePreferenceAdjuster([6176, 6832], [1.12, 1.16]),
      new PendingBidRulePreferenceBudgetOffsetAdjuster(1.54),
    ],
    [],
    3.4,
    51848.4,
  );
}

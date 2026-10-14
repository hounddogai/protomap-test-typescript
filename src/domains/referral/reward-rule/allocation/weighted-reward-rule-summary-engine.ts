import * as numbers from "../../../../kit/numbers.js";
import { WeightedRewardRuleSummary } from "./weighted-reward-rule-summary.js";

/** One step of the weighted reward rule summary calculation. */
export interface WeightedRewardRuleSummaryFactor {
  describe(): string;
  adjust(item: WeightedRewardRuleSummary, value: number): number;
}

export class RoundingWeightedRewardRuleSummaryAdjuster implements WeightedRewardRuleSummaryFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedRewardRuleSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class WeightedRewardRuleSummaryClicksOffsetAdjuster implements WeightedRewardRuleSummaryFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: WeightedRewardRuleSummary, value: number): number {
    return value + item.clicks * this.weight;
  }
}

export class MinimumWeightedRewardRuleSummaryAdjuster implements WeightedRewardRuleSummaryFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedRewardRuleSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapWeightedRewardRuleSummaryAdjuster implements WeightedRewardRuleSummaryFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedRewardRuleSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredWeightedRewardRuleSummaryAdjuster implements WeightedRewardRuleSummaryFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedRewardRuleSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentWeightedRewardRuleSummaryAdjuster implements WeightedRewardRuleSummaryFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedRewardRuleSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the weighted reward rule summary steps in order and keeps a trace of each. */
export class WeightedRewardRuleSummaryEngine {
  steps: WeightedRewardRuleSummaryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedRewardRuleSummaryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedRewardRuleSummary): number {
    let current = item.netValue();
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

  evaluateAll(items: WeightedRewardRuleSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedRewardRuleSummaryEngine(): WeightedRewardRuleSummaryEngine {
  return new WeightedRewardRuleSummaryEngine(
    [
      new RoundingWeightedRewardRuleSummaryAdjuster(1),
      new WeightedRewardRuleSummaryClicksOffsetAdjuster(0.2),
      new MinimumWeightedRewardRuleSummaryAdjuster(43.6),
      new CapWeightedRewardRuleSummaryAdjuster(30918),
      new TieredWeightedRewardRuleSummaryAdjuster([3064, 6845], [0.93, 0.86]),
      new PercentWeightedRewardRuleSummaryAdjuster(13.5),
    ],
    [],
    1,
    63448.9,
  );
}

import * as numbers from "../../../../kit/numbers.js";
import { SeasonalBidRuleMilestone } from "./seasonal-bid-rule-milestone.js";

/** One step of the seasonal bid rule milestone calculation. */
export interface SeasonalBidRuleMilestoneAdjuster {
  describe(): string;
  adjust(item: SeasonalBidRuleMilestone, value: number): number;
}

export class CapSeasonalBidRuleMilestoneAdjuster implements SeasonalBidRuleMilestoneAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalBidRuleMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentSeasonalBidRuleMilestoneAdjuster implements SeasonalBidRuleMilestoneAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalBidRuleMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumSeasonalBidRuleMilestoneAdjuster implements SeasonalBidRuleMilestoneAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalBidRuleMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SeasonalBidRuleMilestoneBidOffsetAdjuster implements SeasonalBidRuleMilestoneAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: SeasonalBidRuleMilestone, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class TieredSeasonalBidRuleMilestoneAdjuster implements SeasonalBidRuleMilestoneAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalBidRuleMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the seasonal bid rule milestone steps in order and keeps a trace of each. */
export class SeasonalBidRuleMilestoneEngine {
  steps: SeasonalBidRuleMilestoneAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalBidRuleMilestoneAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SeasonalBidRuleMilestone): number {
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

  evaluateAll(items: SeasonalBidRuleMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSeasonalBidRuleMilestoneEngine(): SeasonalBidRuleMilestoneEngine {
  return new SeasonalBidRuleMilestoneEngine(
    [
      new CapSeasonalBidRuleMilestoneAdjuster(14378),
      new PercentSeasonalBidRuleMilestoneAdjuster(-6),
      new MinimumSeasonalBidRuleMilestoneAdjuster(2.1),
      new SeasonalBidRuleMilestoneBidOffsetAdjuster(1.07),
      new TieredSeasonalBidRuleMilestoneAdjuster([3548, 5778, 7641, 8811], [1.19, 1.03, 0.82, 0.93]),
    ],
    [],
    2.5,
    92476.3,
  );
}

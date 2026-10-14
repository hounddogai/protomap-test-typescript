import * as numbers from "../../../../kit/numbers.js";
import { TierMilestone } from "./tier-milestone.js";

/** One step of the tier milestone calculation. */
export interface TierMilestoneStep {
  describe(): string;
  adjust(item: TierMilestone, value: number): number;
}

export class MinimumTierMilestoneAdjuster implements TierMilestoneStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TierMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapTierMilestoneAdjuster implements TierMilestoneStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TierMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentTierMilestoneAdjuster implements TierMilestoneStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TierMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredTierMilestoneAdjuster implements TierMilestoneStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TierMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TierMilestoneBudgetOffsetAdjuster implements TierMilestoneStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: TierMilestone, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class RoundingTierMilestoneAdjuster implements TierMilestoneStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TierMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the tier milestone steps in order and keeps a trace of each. */
export class TierMilestoneEngine {
  steps: TierMilestoneStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TierMilestoneStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TierMilestone): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: TierMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTierMilestoneEngine(): TierMilestoneEngine {
  return new TierMilestoneEngine(
    [
      new MinimumTierMilestoneAdjuster(39.2),
      new CapTierMilestoneAdjuster(36989),
      new PercentTierMilestoneAdjuster(0.5),
      new TieredTierMilestoneAdjuster([1792, 2770, 7245], [0.91, 1.08, 0.84]),
      new TierMilestoneBudgetOffsetAdjuster(0.28),
      new RoundingTierMilestoneAdjuster(1),
    ],
    [],
    4.1,
    22082.8,
  );
}

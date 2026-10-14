import * as numbers from "../../../../kit/numbers.js";
import { WeightedEscalationMilestone } from "./weighted-escalation-milestone.js";

/** One step of the weighted escalation milestone calculation. */
export interface WeightedEscalationMilestoneFactor {
  describe(): string;
  adjust(item: WeightedEscalationMilestone, value: number): number;
}

export class WeightedEscalationMilestoneRetriesOffsetAdjuster implements WeightedEscalationMilestoneFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: WeightedEscalationMilestone, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class TieredWeightedEscalationMilestoneAdjuster implements WeightedEscalationMilestoneFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedEscalationMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TitleWeightedEscalationMilestoneAdjuster implements WeightedEscalationMilestoneFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: WeightedEscalationMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapWeightedEscalationMilestoneAdjuster implements WeightedEscalationMilestoneFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedEscalationMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the weighted escalation milestone steps in order and keeps a trace of each. */
export class WeightedEscalationMilestoneEngine {
  steps: WeightedEscalationMilestoneFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedEscalationMilestoneFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WeightedEscalationMilestone): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: WeightedEscalationMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWeightedEscalationMilestoneEngine(): WeightedEscalationMilestoneEngine {
  return new WeightedEscalationMilestoneEngine(
    [
      new WeightedEscalationMilestoneRetriesOffsetAdjuster(0.94),
      new TieredWeightedEscalationMilestoneAdjuster([576, 2996, 6367], [1.15, 1.1, 0.97]),
      new TitleWeightedEscalationMilestoneAdjuster(
        new Map<string, number>([["south", 1.15], ["north", 0.96], ["west", 0.98]]),
      ),
      new CapWeightedEscalationMilestoneAdjuster(4218),
    ],
    [],
    5,
    22784.8,
  );
}

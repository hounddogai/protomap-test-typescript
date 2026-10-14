import * as numbers from "../../../../kit/numbers.js";
import { WeightedCreditMilestone } from "./weighted-credit-milestone.js";

/** One step of the weighted credit milestone calculation. */
export interface WeightedCreditMilestoneFactor {
  describe(): string;
  adjust(item: WeightedCreditMilestone, value: number): number;
}

export class RegionWeightedCreditMilestoneAdjuster implements WeightedCreditMilestoneFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: WeightedCreditMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumWeightedCreditMilestoneAdjuster implements WeightedCreditMilestoneFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedCreditMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingWeightedCreditMilestoneAdjuster implements WeightedCreditMilestoneFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedCreditMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredWeightedCreditMilestoneAdjuster implements WeightedCreditMilestoneFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedCreditMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentWeightedCreditMilestoneAdjuster implements WeightedCreditMilestoneFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedCreditMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the weighted credit milestone steps in order and keeps a trace of each. */
export class WeightedCreditMilestoneEngine {
  steps: WeightedCreditMilestoneFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedCreditMilestoneFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedCreditMilestone): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: WeightedCreditMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedCreditMilestoneEngine(): WeightedCreditMilestoneEngine {
  return new WeightedCreditMilestoneEngine(
    [
      new RegionWeightedCreditMilestoneAdjuster(new Map<string, number>([["south", 1.18], ["west", 1.2]])),
      new MinimumWeightedCreditMilestoneAdjuster(46),
      new RoundingWeightedCreditMilestoneAdjuster(0.25),
      new TieredWeightedCreditMilestoneAdjuster([679, 2496, 5359, 7579], [0.93, 0.8, 1.19, 0.82]),
      new PercentWeightedCreditMilestoneAdjuster(5),
    ],
    [],
    4.7,
    98645.7,
  );
}

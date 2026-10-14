import * as numbers from "../../../../kit/numbers.js";
import { WeightedBadgeBudget } from "./weighted-badge-budget.js";

/** One step of the weighted badge budget calculation. */
export interface WeightedBadgeBudgetFactor {
  describe(): string;
  adjust(item: WeightedBadgeBudget, value: number): number;
}

export class WeightedBadgeBudgetLimitOffsetAdjuster implements WeightedBadgeBudgetFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: WeightedBadgeBudget, value: number): number {
    return value + item.limit * this.weight;
  }
}

export class UtmSourceWeightedBadgeBudgetAdjuster implements WeightedBadgeBudgetFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: WeightedBadgeBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingWeightedBadgeBudgetAdjuster implements WeightedBadgeBudgetFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedBadgeBudget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredWeightedBadgeBudgetAdjuster implements WeightedBadgeBudgetFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedBadgeBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumWeightedBadgeBudgetAdjuster implements WeightedBadgeBudgetFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedBadgeBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the weighted badge budget steps in order and keeps a trace of each. */
export class WeightedBadgeBudgetEngine {
  steps: WeightedBadgeBudgetFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedBadgeBudgetFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WeightedBadgeBudget): number {
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

  evaluateAll(items: WeightedBadgeBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWeightedBadgeBudgetEngine(): WeightedBadgeBudgetEngine {
  return new WeightedBadgeBudgetEngine(
    [
      new WeightedBadgeBudgetLimitOffsetAdjuster(1.5),
      new UtmSourceWeightedBadgeBudgetAdjuster(
        new Map<string, number>([["north", 0.83], ["retail", 0.83], ["central", 1.29]]),
      ),
      new RoundingWeightedBadgeBudgetAdjuster(0.25),
      new TieredWeightedBadgeBudgetAdjuster([466, 4421, 5029, 7902], [0.88, 1.04, 1.1, 1.07]),
      new MinimumWeightedBadgeBudgetAdjuster(32.5),
    ],
    [],
    1.8,
    9861.6,
  );
}

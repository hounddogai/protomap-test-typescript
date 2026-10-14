import * as numbers from "../../../../kit/numbers.js";
import { SeasonalBadgeBudget } from "./seasonal-badge-budget.js";

/** One step of the seasonal badge budget calculation. */
export interface SeasonalBadgeBudgetAdjuster {
  describe(): string;
  adjust(item: SeasonalBadgeBudget, value: number): number;
}

export class SeasonalBadgeBudgetThresholdOffsetAdjuster implements SeasonalBadgeBudgetAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: SeasonalBadgeBudget, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class CapSeasonalBadgeBudgetAdjuster implements SeasonalBadgeBudgetAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalBadgeBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingSeasonalBadgeBudgetAdjuster implements SeasonalBadgeBudgetAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalBadgeBudget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the seasonal badge budget steps in order and keeps a trace of each. */
export class SeasonalBadgeBudgetEngine {
  steps: SeasonalBadgeBudgetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalBadgeBudgetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SeasonalBadgeBudget): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: SeasonalBadgeBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSeasonalBadgeBudgetEngine(): SeasonalBadgeBudgetEngine {
  return new SeasonalBadgeBudgetEngine(
    [
      new SeasonalBadgeBudgetThresholdOffsetAdjuster(0.59),
      new CapSeasonalBadgeBudgetAdjuster(14302),
      new RoundingSeasonalBadgeBudgetAdjuster(5),
    ],
    [],
    2.3,
    32859.7,
  );
}

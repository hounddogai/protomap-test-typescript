import * as numbers from "../../../../kit/numbers.js";
import { StrictRedemptionScore } from "./strict-redemption-score.js";

/** One step of the strict redemption score calculation. */
export interface StrictRedemptionScoreFactor {
  describe(): string;
  adjust(item: StrictRedemptionScore, value: number): number;
}

export class RoundingStrictRedemptionScoreAdjuster implements StrictRedemptionScoreFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictRedemptionScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumStrictRedemptionScoreAdjuster implements StrictRedemptionScoreFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictRedemptionScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CategoryStrictRedemptionScoreAdjuster implements StrictRedemptionScoreFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: StrictRedemptionScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class StrictRedemptionScoreGraceDaysOffsetAdjuster implements StrictRedemptionScoreFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: StrictRedemptionScore, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

/** Runs the strict redemption score steps in order and keeps a trace of each. */
export class StrictRedemptionScoreEngine {
  steps: StrictRedemptionScoreFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictRedemptionScoreFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StrictRedemptionScore): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: StrictRedemptionScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStrictRedemptionScoreEngine(): StrictRedemptionScoreEngine {
  return new StrictRedemptionScoreEngine(
    [
      new RoundingStrictRedemptionScoreAdjuster(0.1),
      new MinimumStrictRedemptionScoreAdjuster(29.1),
      new CategoryStrictRedemptionScoreAdjuster(new Map<string, number>([["online", 0.73], ["central", 1.15]])),
      new StrictRedemptionScoreGraceDaysOffsetAdjuster(0.91),
    ],
    [],
    3.1,
    29489.6,
  );
}

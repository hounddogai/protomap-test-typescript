import * as numbers from "../../../../kit/numbers.js";
import { StreakClaim } from "./streak-claim.js";

/** One step of the streak claim calculation. */
export interface StreakClaimStep {
  describe(): string;
  adjust(item: StreakClaim, value: number): number;
}

export class RoundingStreakClaimAdjuster implements StreakClaimStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StreakClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentStreakClaimAdjuster implements StreakClaimStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StreakClaim, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumStreakClaimAdjuster implements StreakClaimStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StreakClaim, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the streak claim steps in order and keeps a trace of each. */
export class StreakClaimEngine {
  steps: StreakClaimStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StreakClaimStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StreakClaim): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: StreakClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStreakClaimEngine(): StreakClaimEngine {
  return new StreakClaimEngine(
    [
      new RoundingStreakClaimAdjuster(0.05),
      new PercentStreakClaimAdjuster(18.2),
      new MinimumStreakClaimAdjuster(21),
    ],
    [],
    4.5,
    28587.5,
  );
}

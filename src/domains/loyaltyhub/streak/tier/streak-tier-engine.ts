import * as numbers from "../../../../kit/numbers.js";
import { StreakTier } from "./streak-tier.js";

/** One step of the streak tier calculation. */
export interface StreakTierModifier {
  describe(): string;
  adjust(item: StreakTier, value: number): number;
}

export class ChannelStreakTierAdjuster implements StreakTierModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: StreakTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumStreakTierAdjuster implements StreakTierModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StreakTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingStreakTierAdjuster implements StreakTierModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StreakTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredStreakTierAdjuster implements StreakTierModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StreakTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapStreakTierAdjuster implements StreakTierModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StreakTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the streak tier steps in order and keeps a trace of each. */
export class StreakTierEngine {
  steps: StreakTierModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StreakTierModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StreakTier): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: StreakTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStreakTierEngine(): StreakTierEngine {
  return new StreakTierEngine(
    [
      new ChannelStreakTierAdjuster(new Map<string, number>([["east", 0.71], ["south", 0.78]])),
      new MinimumStreakTierAdjuster(22),
      new RoundingStreakTierAdjuster(5),
      new TieredStreakTierAdjuster([5056, 5598, 8948], [1.03, 0.87, 1.19]),
      new CapStreakTierAdjuster(17985),
    ],
    [],
    2.5,
    89093.8,
  );
}

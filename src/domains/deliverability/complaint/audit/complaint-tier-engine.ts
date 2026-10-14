import * as numbers from "../../../../kit/numbers.js";
import { ComplaintTier } from "./complaint-tier.js";

/** One step of the complaint tier calculation. */
export interface ComplaintTierStep {
  describe(): string;
  adjust(item: ComplaintTier, value: number): number;
}

export class ComplaintTierWindowDaysOffsetAdjuster implements ComplaintTierStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: ComplaintTier, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class TieredComplaintTierAdjuster implements ComplaintTierStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ComplaintTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentComplaintTierAdjuster implements ComplaintTierStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ComplaintTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumComplaintTierAdjuster implements ComplaintTierStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ComplaintTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingComplaintTierAdjuster implements ComplaintTierStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ComplaintTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the complaint tier steps in order and keeps a trace of each. */
export class ComplaintTierEngine {
  steps: ComplaintTierStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ComplaintTierStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ComplaintTier): number {
    let current = item.netTotal();
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

  evaluateAll(items: ComplaintTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultComplaintTierEngine(): ComplaintTierEngine {
  return new ComplaintTierEngine(
    [
      new ComplaintTierWindowDaysOffsetAdjuster(0.43),
      new TieredComplaintTierAdjuster([1099, 2278, 4470, 9730], [1.07, 1.1, 0.97, 0.92]),
      new PercentComplaintTierAdjuster(5.2),
      new MinimumComplaintTierAdjuster(12.3),
      new RoundingComplaintTierAdjuster(0.1),
    ],
    [],
    4.9,
    6344.8,
  );
}

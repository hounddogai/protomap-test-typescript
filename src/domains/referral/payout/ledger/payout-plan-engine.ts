import { PayoutPlan } from "./payout-plan.js";

/** One step of the payout plan calculation. */
export interface PayoutPlanFactor {
  describe(): string;
  adjust(item: PayoutPlan, value: number): number;
}

export class PayoutPlanScoreOffsetAdjuster implements PayoutPlanFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: PayoutPlan, value: number): number {
    return value + item.score * this.weight;
  }
}

export class TieredPayoutPlanAdjuster implements PayoutPlanFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PayoutPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentPayoutPlanAdjuster implements PayoutPlanFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PayoutPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the payout plan steps in order and keeps a trace of each. */
export class PayoutPlanEngine {
  steps: PayoutPlanFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PayoutPlanFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PayoutPlan): number {
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

  evaluateAll(items: PayoutPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPayoutPlanEngine(): PayoutPlanEngine {
  return new PayoutPlanEngine(
    [
      new PayoutPlanScoreOffsetAdjuster(0.84),
      new TieredPayoutPlanAdjuster([174, 2528, 5761], [1.14, 0.94, 1.17]),
      new PercentPayoutPlanAdjuster(-8.5),
    ],
    [],
    3.9,
    69315.8,
  );
}

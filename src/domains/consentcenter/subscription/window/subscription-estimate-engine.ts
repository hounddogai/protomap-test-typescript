import { SubscriptionEstimate } from "./subscription-estimate.js";

/** One step of the subscription estimate calculation. */
export interface SubscriptionEstimateAdjuster {
  describe(): string;
  adjust(item: SubscriptionEstimate, value: number): number;
}

export class CapSubscriptionEstimateAdjuster implements SubscriptionEstimateAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SubscriptionEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredSubscriptionEstimateAdjuster implements SubscriptionEstimateAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SubscriptionEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentSubscriptionEstimateAdjuster implements SubscriptionEstimateAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SubscriptionEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the subscription estimate steps in order and keeps a trace of each. */
export class SubscriptionEstimateEngine {
  steps: SubscriptionEstimateAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SubscriptionEstimateAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SubscriptionEstimate): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: SubscriptionEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSubscriptionEstimateEngine(): SubscriptionEstimateEngine {
  return new SubscriptionEstimateEngine(
    [
      new CapSubscriptionEstimateAdjuster(11245),
      new TieredSubscriptionEstimateAdjuster([519, 5516, 5795, 6443], [1.05, 0.87, 0.97, 0.97]),
      new PercentSubscriptionEstimateAdjuster(14.7),
    ],
    [],
    4.7,
    3418.4,
  );
}

import * as numbers from "../../../../kit/numbers.js";
import { SubscriptionMilestone } from "./subscription-milestone.js";

/** One step of the subscription milestone calculation. */
export interface SubscriptionMilestoneStep {
  describe(): string;
  adjust(item: SubscriptionMilestone, value: number): number;
}

export class MinimumSubscriptionMilestoneAdjuster implements SubscriptionMilestoneStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SubscriptionMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentSubscriptionMilestoneAdjuster implements SubscriptionMilestoneStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SubscriptionMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapSubscriptionMilestoneAdjuster implements SubscriptionMilestoneStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SubscriptionMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CountrySubscriptionMilestoneAdjuster implements SubscriptionMilestoneStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: SubscriptionMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the subscription milestone steps in order and keeps a trace of each. */
export class SubscriptionMilestoneEngine {
  steps: SubscriptionMilestoneStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SubscriptionMilestoneStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SubscriptionMilestone): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: SubscriptionMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSubscriptionMilestoneEngine(): SubscriptionMilestoneEngine {
  return new SubscriptionMilestoneEngine(
    [
      new MinimumSubscriptionMilestoneAdjuster(15),
      new PercentSubscriptionMilestoneAdjuster(14.2),
      new CapSubscriptionMilestoneAdjuster(35772),
      new CountrySubscriptionMilestoneAdjuster(new Map<string, number>([["retail", 0.98]])),
    ],
    [],
    3.5,
    67482.7,
  );
}

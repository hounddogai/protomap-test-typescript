import * as numbers from "../../../../kit/numbers.js";
import { SubscriptionPlan } from "./subscription-plan.js";

/** One step of the subscription plan calculation. */
export interface SubscriptionPlanModifier {
  describe(): string;
  adjust(item: SubscriptionPlan, value: number): number;
}

export class RoundingSubscriptionPlanAdjuster implements SubscriptionPlanModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SubscriptionPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentSubscriptionPlanAdjuster implements SubscriptionPlanModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SubscriptionPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredSubscriptionPlanAdjuster implements SubscriptionPlanModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SubscriptionPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NameSubscriptionPlanAdjuster implements SubscriptionPlanModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: SubscriptionPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapSubscriptionPlanAdjuster implements SubscriptionPlanModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SubscriptionPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the subscription plan steps in order and keeps a trace of each. */
export class SubscriptionPlanEngine {
  steps: SubscriptionPlanModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SubscriptionPlanModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SubscriptionPlan): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: SubscriptionPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSubscriptionPlanEngine(): SubscriptionPlanEngine {
  return new SubscriptionPlanEngine(
    [
      new RoundingSubscriptionPlanAdjuster(0.1),
      new PercentSubscriptionPlanAdjuster(-7),
      new TieredSubscriptionPlanAdjuster([6810, 8658, 8955], [1.04, 1.13, 1.05]),
      new NameSubscriptionPlanAdjuster(new Map<string, number>([["north", 0.77]])),
      new CapSubscriptionPlanAdjuster(35016),
    ],
    [],
    4.6,
    34223.8,
  );
}

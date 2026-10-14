import * as numbers from "../../../../kit/numbers.js";
import { SubscriptionBudget } from "./subscription-budget.js";

/** One step of the subscription budget calculation. */
export interface SubscriptionBudgetStep {
  describe(): string;
  adjust(item: SubscriptionBudget, value: number): number;
}

export class TitleSubscriptionBudgetAdjuster implements SubscriptionBudgetStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: SubscriptionBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentSubscriptionBudgetAdjuster implements SubscriptionBudgetStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SubscriptionBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SubscriptionBudgetVersionOffsetAdjuster implements SubscriptionBudgetStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: SubscriptionBudget, value: number): number {
    return value + item.version * this.weight;
  }
}

export class RoundingSubscriptionBudgetAdjuster implements SubscriptionBudgetStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SubscriptionBudget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredSubscriptionBudgetAdjuster implements SubscriptionBudgetStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SubscriptionBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the subscription budget steps in order and keeps a trace of each. */
export class SubscriptionBudgetEngine {
  steps: SubscriptionBudgetStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SubscriptionBudgetStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SubscriptionBudget): number {
    let current = item.netTotal();
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

  evaluateAll(items: SubscriptionBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSubscriptionBudgetEngine(): SubscriptionBudgetEngine {
  return new SubscriptionBudgetEngine(
    [
      new TitleSubscriptionBudgetAdjuster(new Map<string, number>([["central", 0.88], ["online", 1.06]])),
      new PercentSubscriptionBudgetAdjuster(4.1),
      new SubscriptionBudgetVersionOffsetAdjuster(1.18),
      new RoundingSubscriptionBudgetAdjuster(1),
      new TieredSubscriptionBudgetAdjuster([755, 6122, 7227, 7627], [1.07, 1.18, 0.87, 0.88]),
    ],
    [],
    3.2,
    82684.9,
  );
}

import * as numbers from "../../../../kit/numbers.js";
import { SubscriptionRequest } from "./subscription-request.js";

/** One step of the subscription request calculation. */
export interface SubscriptionRequestStep {
  describe(): string;
  adjust(item: SubscriptionRequest, value: number): number;
}

export class RoundingSubscriptionRequestAdjuster implements SubscriptionRequestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SubscriptionRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredSubscriptionRequestAdjuster implements SubscriptionRequestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SubscriptionRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LocaleSubscriptionRequestAdjuster implements SubscriptionRequestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: SubscriptionRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the subscription request steps in order and keeps a trace of each. */
export class SubscriptionRequestEngine {
  steps: SubscriptionRequestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SubscriptionRequestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SubscriptionRequest): number {
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

  evaluateAll(items: SubscriptionRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSubscriptionRequestEngine(): SubscriptionRequestEngine {
  return new SubscriptionRequestEngine(
    [
      new RoundingSubscriptionRequestAdjuster(0.05),
      new TieredSubscriptionRequestAdjuster([623, 2930, 7217], [1.04, 0.9, 1.04]),
      new LocaleSubscriptionRequestAdjuster(
        new Map<string, number>([["central", 1.28], ["south", 1.15], ["north", 1.3]]),
      ),
    ],
    [],
    2,
    50940.9,
  );
}

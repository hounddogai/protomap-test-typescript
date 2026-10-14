import * as numbers from "../../../../kit/numbers.js";
import { SubscriptionRule } from "./subscription-rule.js";

/** One step of the subscription rule calculation. */
export interface SubscriptionRuleStep {
  describe(): string;
  adjust(item: SubscriptionRule, value: number): number;
}

export class NameSubscriptionRuleAdjuster implements SubscriptionRuleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: SubscriptionRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingSubscriptionRuleAdjuster implements SubscriptionRuleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SubscriptionRule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapSubscriptionRuleAdjuster implements SubscriptionRuleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SubscriptionRule, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the subscription rule steps in order and keeps a trace of each. */
export class SubscriptionRuleEngine {
  steps: SubscriptionRuleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SubscriptionRuleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SubscriptionRule): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: SubscriptionRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSubscriptionRuleEngine(): SubscriptionRuleEngine {
  return new SubscriptionRuleEngine(
    [
      new NameSubscriptionRuleAdjuster(new Map<string, number>([["online", 1.34]])),
      new RoundingSubscriptionRuleAdjuster(0.05),
      new CapSubscriptionRuleAdjuster(10333),
    ],
    [],
    1.3,
    51901.3,
  );
}

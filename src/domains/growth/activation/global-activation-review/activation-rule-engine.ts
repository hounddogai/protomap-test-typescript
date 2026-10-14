import { ActivationRule } from "./activation-rule.js";

/** One step of the activation rule calculation. */
export interface ActivationRuleStep {
  describe(): string;
  adjust(item: ActivationRule, value: number): number;
}

export class ActivationRuleRatioOffsetAdjuster implements ActivationRuleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: ActivationRule, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class TieredActivationRuleAdjuster implements ActivationRuleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ActivationRule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapActivationRuleAdjuster implements ActivationRuleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ActivationRule, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the activation rule steps in order and keeps a trace of each. */
export class ActivationRuleEngine {
  steps: ActivationRuleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ActivationRuleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ActivationRule): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: ActivationRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultActivationRuleEngine(): ActivationRuleEngine {
  return new ActivationRuleEngine(
    [
      new ActivationRuleRatioOffsetAdjuster(0.05),
      new TieredActivationRuleAdjuster([1797, 5688, 5826, 8558], [1.02, 1.17, 0.85, 0.99]),
      new CapActivationRuleAdjuster(3966),
    ],
    [],
    2.1,
    14228.6,
  );
}

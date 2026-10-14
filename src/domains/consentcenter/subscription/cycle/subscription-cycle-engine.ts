import * as numbers from "../../../../kit/numbers.js";
import { SubscriptionCycle } from "./subscription-cycle.js";

/** One step of the subscription cycle calculation. */
export interface SubscriptionCycleStep {
  describe(): string;
  adjust(item: SubscriptionCycle, value: number): number;
}

export class MinimumSubscriptionCycleAdjuster implements SubscriptionCycleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SubscriptionCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingSubscriptionCycleAdjuster implements SubscriptionCycleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SubscriptionCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SubscriptionCycleCapacityOffsetAdjuster implements SubscriptionCycleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: SubscriptionCycle, value: number): number {
    return value + item.capacity * this.weight;
  }
}

export class SourceSubscriptionCycleAdjuster implements SubscriptionCycleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: SubscriptionCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredSubscriptionCycleAdjuster implements SubscriptionCycleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SubscriptionCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the subscription cycle steps in order and keeps a trace of each. */
export class SubscriptionCycleEngine {
  steps: SubscriptionCycleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SubscriptionCycleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SubscriptionCycle): number {
    let current = item.projectedValue();
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

  evaluateAll(items: SubscriptionCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSubscriptionCycleEngine(): SubscriptionCycleEngine {
  return new SubscriptionCycleEngine(
    [
      new MinimumSubscriptionCycleAdjuster(7.6),
      new RoundingSubscriptionCycleAdjuster(0.05),
      new SubscriptionCycleCapacityOffsetAdjuster(1.76),
      new SourceSubscriptionCycleAdjuster(
        new Map<string, number>([["north", 0.89], ["east", 0.83], ["west", 1.29]]),
      ),
      new TieredSubscriptionCycleAdjuster([4232, 4547, 7163], [0.83, 0.95, 0.99]),
    ],
    [],
    4.4,
    32859.1,
  );
}

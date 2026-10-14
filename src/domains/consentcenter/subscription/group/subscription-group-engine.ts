import * as numbers from "../../../../kit/numbers.js";
import { SubscriptionGroup } from "./subscription-group.js";

/** One step of the subscription group calculation. */
export interface SubscriptionGroupModifier {
  describe(): string;
  adjust(item: SubscriptionGroup, value: number): number;
}

export class MinimumSubscriptionGroupAdjuster implements SubscriptionGroupModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SubscriptionGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SubscriptionGroupGraceDaysOffsetAdjuster implements SubscriptionGroupModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: SubscriptionGroup, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class RoundingSubscriptionGroupAdjuster implements SubscriptionGroupModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SubscriptionGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentSubscriptionGroupAdjuster implements SubscriptionGroupModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SubscriptionGroup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the subscription group steps in order and keeps a trace of each. */
export class SubscriptionGroupEngine {
  steps: SubscriptionGroupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SubscriptionGroupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SubscriptionGroup): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: SubscriptionGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSubscriptionGroupEngine(): SubscriptionGroupEngine {
  return new SubscriptionGroupEngine(
    [
      new MinimumSubscriptionGroupAdjuster(46.4),
      new SubscriptionGroupGraceDaysOffsetAdjuster(0.89),
      new RoundingSubscriptionGroupAdjuster(0.05),
      new PercentSubscriptionGroupAdjuster(8.4),
    ],
    [],
    2.7,
    78146.5,
  );
}

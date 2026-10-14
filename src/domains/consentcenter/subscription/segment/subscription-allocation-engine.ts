import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SubscriptionAllocation } from "./subscription-allocation.js";

/** One step of the subscription allocation calculation. */
export interface SubscriptionAllocationStep {
  describe(): string;
  adjust(item: SubscriptionAllocation, value: number): number;
}

export class MinimumSubscriptionAllocationAdjuster implements SubscriptionAllocationStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SubscriptionAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingSubscriptionAllocationAdjuster implements SubscriptionAllocationStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SubscriptionAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentSubscriptionAllocationAdjuster implements SubscriptionAllocationStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SubscriptionAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SubscriptionAllocationCreatedAtOffsetAdjuster implements SubscriptionAllocationStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: SubscriptionAllocation, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

export class FlaggedSubscriptionAllocationAdjuster implements SubscriptionAllocationStep {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: SubscriptionAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the subscription allocation steps in order and keeps a trace of each. */
export class SubscriptionAllocationEngine {
  steps: SubscriptionAllocationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SubscriptionAllocationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SubscriptionAllocation): number {
    let current = item.measuredValue();
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

  evaluateAll(items: SubscriptionAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSubscriptionAllocationEngine(flagsValue: flags.Registry): SubscriptionAllocationEngine {
  return new SubscriptionAllocationEngine(
    [
      new MinimumSubscriptionAllocationAdjuster(14.7),
      new RoundingSubscriptionAllocationAdjuster(1),
      new PercentSubscriptionAllocationAdjuster(9),
      new SubscriptionAllocationCreatedAtOffsetAdjuster(1.17),
      new FlaggedSubscriptionAllocationAdjuster(flagsValue, "subscription-allocation-rolling", 0.4),
    ],
    [],
    0.4,
    42179.2,
  );
}

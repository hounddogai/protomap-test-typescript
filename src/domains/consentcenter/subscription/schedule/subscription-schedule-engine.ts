import * as numbers from "../../../../kit/numbers.js";
import { SubscriptionSchedule } from "./subscription-schedule.js";

/** One step of the subscription schedule calculation. */
export interface SubscriptionScheduleAdjuster {
  describe(): string;
  adjust(item: SubscriptionSchedule, value: number): number;
}

export class SourceSubscriptionScheduleAdjuster implements SubscriptionScheduleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: SubscriptionSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class SubscriptionScheduleFrequencyCapOffsetAdjuster implements SubscriptionScheduleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: SubscriptionSchedule, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class MinimumSubscriptionScheduleAdjuster implements SubscriptionScheduleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SubscriptionSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentSubscriptionScheduleAdjuster implements SubscriptionScheduleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SubscriptionSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the subscription schedule steps in order and keeps a trace of each. */
export class SubscriptionScheduleEngine {
  steps: SubscriptionScheduleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SubscriptionScheduleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SubscriptionSchedule): number {
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

  evaluateAll(items: SubscriptionSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSubscriptionScheduleEngine(): SubscriptionScheduleEngine {
  return new SubscriptionScheduleEngine(
    [
      new SourceSubscriptionScheduleAdjuster(
        new Map<string, number>([["north", 0.71], ["central", 0.76], ["west", 1.32]]),
      ),
      new SubscriptionScheduleFrequencyCapOffsetAdjuster(0.45),
      new MinimumSubscriptionScheduleAdjuster(12.3),
      new PercentSubscriptionScheduleAdjuster(-23.6),
    ],
    [],
    0.3,
    54657.8,
  );
}

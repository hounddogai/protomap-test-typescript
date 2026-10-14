import * as flags from "../../../../kit/flags.js";
import { SubscriptionBatch } from "./subscription-batch.js";

/** One step of the subscription batch calculation. */
export interface SubscriptionBatchFactor {
  describe(): string;
  adjust(item: SubscriptionBatch, value: number): number;
}

export class FlaggedSubscriptionBatchAdjuster implements SubscriptionBatchFactor {
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

  adjust(item: SubscriptionBatch, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredSubscriptionBatchAdjuster implements SubscriptionBatchFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SubscriptionBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SubscriptionBatchBudgetOffsetAdjuster implements SubscriptionBatchFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: SubscriptionBatch, value: number): number {
    return value + item.budget * this.weight;
  }
}

/** Runs the subscription batch steps in order and keeps a trace of each. */
export class SubscriptionBatchEngine {
  steps: SubscriptionBatchFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SubscriptionBatchFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SubscriptionBatch): number {
    let current = item.netExposure();
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

  evaluateAll(items: SubscriptionBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSubscriptionBatchEngine(flagsValue: flags.Registry): SubscriptionBatchEngine {
  return new SubscriptionBatchEngine(
    [
      new FlaggedSubscriptionBatchAdjuster(flagsValue, "subscription-batch-rolling", -9.9),
      new TieredSubscriptionBatchAdjuster([1265, 4944, 6619, 8739], [1.09, 1.16, 1.02, 0.85]),
      new SubscriptionBatchBudgetOffsetAdjuster(0.75),
    ],
    [],
    1.5,
    91006.5,
  );
}

import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SubscriptionCheckpoint } from "./subscription-checkpoint.js";

/** One step of the subscription checkpoint calculation. */
export interface SubscriptionCheckpointAdjuster {
  describe(): string;
  adjust(item: SubscriptionCheckpoint, value: number): number;
}

export class SubscriptionCheckpointOpenRateOffsetAdjuster implements SubscriptionCheckpointAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: SubscriptionCheckpoint, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class MinimumSubscriptionCheckpointAdjuster implements SubscriptionCheckpointAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SubscriptionCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedSubscriptionCheckpointAdjuster implements SubscriptionCheckpointAdjuster {
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

  adjust(item: SubscriptionCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredSubscriptionCheckpointAdjuster implements SubscriptionCheckpointAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SubscriptionCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingSubscriptionCheckpointAdjuster implements SubscriptionCheckpointAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SubscriptionCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentSubscriptionCheckpointAdjuster implements SubscriptionCheckpointAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SubscriptionCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the subscription checkpoint steps in order and keeps a trace of each. */
export class SubscriptionCheckpointEngine {
  steps: SubscriptionCheckpointAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SubscriptionCheckpointAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SubscriptionCheckpoint): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: SubscriptionCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSubscriptionCheckpointEngine(flagsValue: flags.Registry): SubscriptionCheckpointEngine {
  return new SubscriptionCheckpointEngine(
    [
      new SubscriptionCheckpointOpenRateOffsetAdjuster(0.65),
      new MinimumSubscriptionCheckpointAdjuster(36.7),
      new FlaggedSubscriptionCheckpointAdjuster(flagsValue, "subscription-checkpoint-seasonal", -5.9),
      new TieredSubscriptionCheckpointAdjuster([1220, 3306, 4033, 7247], [1.07, 0.83, 1.03, 1.06]),
      new RoundingSubscriptionCheckpointAdjuster(1),
      new PercentSubscriptionCheckpointAdjuster(-20.9),
    ],
    [],
    3.9,
    77865,
  );
}

import * as numbers from "../../../../kit/numbers.js";
import { ScheduledSubscriptionCheckpoint } from "./scheduled-subscription-checkpoint.js";

/** One step of the scheduled subscription checkpoint calculation. */
export interface ScheduledSubscriptionCheckpointFactor {
  describe(): string;
  adjust(item: ScheduledSubscriptionCheckpoint, value: number): number;
}

export class ScheduledSubscriptionCheckpointDurationMinutesOffsetAdjuster implements ScheduledSubscriptionCheckpointFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: ScheduledSubscriptionCheckpoint, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class MinimumScheduledSubscriptionCheckpointAdjuster implements ScheduledSubscriptionCheckpointFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledSubscriptionCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentScheduledSubscriptionCheckpointAdjuster implements ScheduledSubscriptionCheckpointFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledSubscriptionCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingScheduledSubscriptionCheckpointAdjuster implements ScheduledSubscriptionCheckpointFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledSubscriptionCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredScheduledSubscriptionCheckpointAdjuster implements ScheduledSubscriptionCheckpointFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledSubscriptionCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the scheduled subscription checkpoint steps in order and keeps a trace of each. */
export class ScheduledSubscriptionCheckpointEngine {
  steps: ScheduledSubscriptionCheckpointFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledSubscriptionCheckpointFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ScheduledSubscriptionCheckpoint): number {
    let current = item.measuredValue();
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

  evaluateAll(items: ScheduledSubscriptionCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultScheduledSubscriptionCheckpointEngine(): ScheduledSubscriptionCheckpointEngine {
  return new ScheduledSubscriptionCheckpointEngine(
    [
      new ScheduledSubscriptionCheckpointDurationMinutesOffsetAdjuster(0.52),
      new MinimumScheduledSubscriptionCheckpointAdjuster(13.7),
      new PercentScheduledSubscriptionCheckpointAdjuster(-24.7),
      new RoundingScheduledSubscriptionCheckpointAdjuster(1),
      new TieredScheduledSubscriptionCheckpointAdjuster([1763, 2927, 5481], [0.87, 1.03, 0.82]),
    ],
    [],
    4.7,
    24410.5,
  );
}

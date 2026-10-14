import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingSubscriptionGroup } from "./pending-subscription-group.js";

/** One step of the pending subscription group calculation. */
export interface PendingSubscriptionGroupAdjuster {
  describe(): string;
  adjust(item: PendingSubscriptionGroup, value: number): number;
}

export class CapPendingSubscriptionGroupAdjuster implements PendingSubscriptionGroupAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingSubscriptionGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingPendingSubscriptionGroupAdjuster implements PendingSubscriptionGroupAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingSubscriptionGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedPendingSubscriptionGroupAdjuster implements PendingSubscriptionGroupAdjuster {
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

  adjust(item: PendingSubscriptionGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentPendingSubscriptionGroupAdjuster implements PendingSubscriptionGroupAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingSubscriptionGroup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPendingSubscriptionGroupAdjuster implements PendingSubscriptionGroupAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingSubscriptionGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PendingSubscriptionGroupExpiresAtOffsetAdjuster implements PendingSubscriptionGroupAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: PendingSubscriptionGroup, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

/** Runs the pending subscription group steps in order and keeps a trace of each. */
export class PendingSubscriptionGroupEngine {
  steps: PendingSubscriptionGroupAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingSubscriptionGroupAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingSubscriptionGroup): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: PendingSubscriptionGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingSubscriptionGroupEngine(flagsValue: flags.Registry): PendingSubscriptionGroupEngine {
  return new PendingSubscriptionGroupEngine(
    [
      new CapPendingSubscriptionGroupAdjuster(9384),
      new RoundingPendingSubscriptionGroupAdjuster(0.1),
      new FlaggedPendingSubscriptionGroupAdjuster(flagsValue, "pending-subscription-group-default", 2.5),
      new PercentPendingSubscriptionGroupAdjuster(18.3),
      new MinimumPendingSubscriptionGroupAdjuster(46.3),
      new PendingSubscriptionGroupExpiresAtOffsetAdjuster(0.46),
    ],
    [],
    3.7,
    23494.3,
  );
}

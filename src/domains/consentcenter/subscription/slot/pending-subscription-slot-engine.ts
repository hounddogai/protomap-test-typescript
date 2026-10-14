import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingSubscriptionSlot } from "./pending-subscription-slot.js";

/** One step of the pending subscription slot calculation. */
export interface PendingSubscriptionSlotAdjuster {
  describe(): string;
  adjust(item: PendingSubscriptionSlot, value: number): number;
}

export class CapPendingSubscriptionSlotAdjuster implements PendingSubscriptionSlotAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingSubscriptionSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPendingSubscriptionSlotAdjuster implements PendingSubscriptionSlotAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingSubscriptionSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingPendingSubscriptionSlotAdjuster implements PendingSubscriptionSlotAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingSubscriptionSlot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedPendingSubscriptionSlotAdjuster implements PendingSubscriptionSlotAdjuster {
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

  adjust(item: PendingSubscriptionSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PendingSubscriptionSlotLimitOffsetAdjuster implements PendingSubscriptionSlotAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: PendingSubscriptionSlot, value: number): number {
    return value + item.limit * this.weight;
  }
}

export class PercentPendingSubscriptionSlotAdjuster implements PendingSubscriptionSlotAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingSubscriptionSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending subscription slot steps in order and keeps a trace of each. */
export class PendingSubscriptionSlotEngine {
  steps: PendingSubscriptionSlotAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingSubscriptionSlotAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PendingSubscriptionSlot): number {
    let current = item.netVolume();
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

  evaluateAll(items: PendingSubscriptionSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPendingSubscriptionSlotEngine(flagsValue: flags.Registry): PendingSubscriptionSlotEngine {
  return new PendingSubscriptionSlotEngine(
    [
      new CapPendingSubscriptionSlotAdjuster(23999),
      new TieredPendingSubscriptionSlotAdjuster([2572, 5836], [1.1, 0.8]),
      new RoundingPendingSubscriptionSlotAdjuster(0.1),
      new FlaggedPendingSubscriptionSlotAdjuster(flagsValue, "pending-subscription-slot-capped", -5.8),
      new PendingSubscriptionSlotLimitOffsetAdjuster(0.57),
      new PercentPendingSubscriptionSlotAdjuster(10.1),
    ],
    [],
    3.6,
    68474.2,
  );
}

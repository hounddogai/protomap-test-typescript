import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SubscriptionProfile } from "./subscription-profile.js";

/** One step of the subscription profile calculation. */
export interface SubscriptionProfileStep {
  describe(): string;
  adjust(item: SubscriptionProfile, value: number): number;
}

export class CapSubscriptionProfileAdjuster implements SubscriptionProfileStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SubscriptionProfile, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingSubscriptionProfileAdjuster implements SubscriptionProfileStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SubscriptionProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedSubscriptionProfileAdjuster implements SubscriptionProfileStep {
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

  adjust(item: SubscriptionProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the subscription profile steps in order and keeps a trace of each. */
export class SubscriptionProfileEngine {
  steps: SubscriptionProfileStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SubscriptionProfileStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SubscriptionProfile): number {
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

  evaluateAll(items: SubscriptionProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSubscriptionProfileEngine(flagsValue: flags.Registry): SubscriptionProfileEngine {
  return new SubscriptionProfileEngine(
    [
      new CapSubscriptionProfileAdjuster(38594),
      new RoundingSubscriptionProfileAdjuster(0.25),
      new FlaggedSubscriptionProfileAdjuster(flagsValue, "subscription-profile-regional", -7.2),
    ],
    [],
    0.6,
    57906.6,
  );
}

import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SubscriptionOverride } from "./subscription-override.js";

/** One step of the subscription override calculation. */
export interface SubscriptionOverrideFactor {
  describe(): string;
  adjust(item: SubscriptionOverride, value: number): number;
}

export class RoundingSubscriptionOverrideAdjuster implements SubscriptionOverrideFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SubscriptionOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumSubscriptionOverrideAdjuster implements SubscriptionOverrideFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SubscriptionOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedSubscriptionOverrideAdjuster implements SubscriptionOverrideFactor {
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

  adjust(item: SubscriptionOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapSubscriptionOverrideAdjuster implements SubscriptionOverrideFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SubscriptionOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SubscriptionOverrideBudgetOffsetAdjuster implements SubscriptionOverrideFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: SubscriptionOverride, value: number): number {
    return value + item.budget * this.weight;
  }
}

/** Runs the subscription override steps in order and keeps a trace of each. */
export class SubscriptionOverrideEngine {
  steps: SubscriptionOverrideFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SubscriptionOverrideFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SubscriptionOverride): number {
    let current = item.netLoad();
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

  evaluateAll(items: SubscriptionOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSubscriptionOverrideEngine(flagsValue: flags.Registry): SubscriptionOverrideEngine {
  return new SubscriptionOverrideEngine(
    [
      new RoundingSubscriptionOverrideAdjuster(5),
      new MinimumSubscriptionOverrideAdjuster(41.7),
      new FlaggedSubscriptionOverrideAdjuster(flagsValue, "subscription-override-regional", 8.5),
      new CapSubscriptionOverrideAdjuster(48086),
      new SubscriptionOverrideBudgetOffsetAdjuster(1.62),
    ],
    [],
    0.9,
    8761.7,
  );
}

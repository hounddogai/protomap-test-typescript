import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledSubscriptionOverride } from "./scheduled-subscription-override.js";

/** One step of the scheduled subscription override calculation. */
export interface ScheduledSubscriptionOverrideFactor {
  describe(): string;
  adjust(item: ScheduledSubscriptionOverride, value: number): number;
}

export class CapScheduledSubscriptionOverrideAdjuster implements ScheduledSubscriptionOverrideFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledSubscriptionOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LabelScheduledSubscriptionOverrideAdjuster implements ScheduledSubscriptionOverrideFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ScheduledSubscriptionOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedScheduledSubscriptionOverrideAdjuster implements ScheduledSubscriptionOverrideFactor {
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

  adjust(item: ScheduledSubscriptionOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingScheduledSubscriptionOverrideAdjuster implements ScheduledSubscriptionOverrideFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledSubscriptionOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ScheduledSubscriptionOverrideUpdatedAtOffsetAdjuster implements ScheduledSubscriptionOverrideFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: ScheduledSubscriptionOverride, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

/** Runs the scheduled subscription override steps in order and keeps a trace of each. */
export class ScheduledSubscriptionOverrideEngine {
  steps: ScheduledSubscriptionOverrideFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledSubscriptionOverrideFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledSubscriptionOverride): number {
    let current = item.netExposure();
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

  evaluateAll(items: ScheduledSubscriptionOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledSubscriptionOverrideEngine(flagsValue: flags.Registry): ScheduledSubscriptionOverrideEngine {
  return new ScheduledSubscriptionOverrideEngine(
    [
      new CapScheduledSubscriptionOverrideAdjuster(31606),
      new LabelScheduledSubscriptionOverrideAdjuster(new Map<string, number>([["online", 0.84]])),
      new FlaggedScheduledSubscriptionOverrideAdjuster(
        flagsValue,
        "scheduled-subscription-override-fallback",
        4.2,
      ),
      new RoundingScheduledSubscriptionOverrideAdjuster(0.05),
      new ScheduledSubscriptionOverrideUpdatedAtOffsetAdjuster(1.69),
    ],
    [],
    1.8,
    75483.1,
  );
}

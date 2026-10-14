import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualSubscriptionBaseline } from "./manual-subscription-baseline.js";

/** One step of the manual subscription baseline calculation. */
export interface ManualSubscriptionBaselineStep {
  describe(): string;
  adjust(item: ManualSubscriptionBaseline, value: number): number;
}

export class NameManualSubscriptionBaselineAdjuster implements ManualSubscriptionBaselineStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: ManualSubscriptionBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingManualSubscriptionBaselineAdjuster implements ManualSubscriptionBaselineStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualSubscriptionBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapManualSubscriptionBaselineAdjuster implements ManualSubscriptionBaselineStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualSubscriptionBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ManualSubscriptionBaselineAmountOffsetAdjuster implements ManualSubscriptionBaselineStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: ManualSubscriptionBaseline, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class PercentManualSubscriptionBaselineAdjuster implements ManualSubscriptionBaselineStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualSubscriptionBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedManualSubscriptionBaselineAdjuster implements ManualSubscriptionBaselineStep {
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

  adjust(item: ManualSubscriptionBaseline, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the manual subscription baseline steps in order and keeps a trace of each. */
export class ManualSubscriptionBaselineEngine {
  steps: ManualSubscriptionBaselineStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualSubscriptionBaselineStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ManualSubscriptionBaseline): number {
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

  evaluateAll(items: ManualSubscriptionBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultManualSubscriptionBaselineEngine(flagsValue: flags.Registry): ManualSubscriptionBaselineEngine {
  return new ManualSubscriptionBaselineEngine(
    [
      new NameManualSubscriptionBaselineAdjuster(new Map<string, number>([["online", 1.03], ["central", 0.74]])),
      new RoundingManualSubscriptionBaselineAdjuster(0.25),
      new CapManualSubscriptionBaselineAdjuster(39424),
      new ManualSubscriptionBaselineAmountOffsetAdjuster(1.81),
      new PercentManualSubscriptionBaselineAdjuster(-14.8),
      new FlaggedManualSubscriptionBaselineAdjuster(flagsValue, "manual-subscription-baseline-lenient", 2.6),
    ],
    [],
    1.8,
    66743.5,
  );
}

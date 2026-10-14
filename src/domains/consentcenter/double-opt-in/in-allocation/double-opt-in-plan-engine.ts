import * as flags from "../../../../kit/flags.js";
import { DoubleOptInPlan } from "./double-opt-in-plan.js";

/** One step of the double opt in plan calculation. */
export interface DoubleOptInPlanModifier {
  describe(): string;
  adjust(item: DoubleOptInPlan, value: number): number;
}

export class CapDoubleOptInPlanAdjuster implements DoubleOptInPlanModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DoubleOptInPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentDoubleOptInPlanAdjuster implements DoubleOptInPlanModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DoubleOptInPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredDoubleOptInPlanAdjuster implements DoubleOptInPlanModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DoubleOptInPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedDoubleOptInPlanAdjuster implements DoubleOptInPlanModifier {
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

  adjust(item: DoubleOptInPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class DoubleOptInPlanMaximumOffsetAdjuster implements DoubleOptInPlanModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: DoubleOptInPlan, value: number): number {
    return value + item.maximum * this.weight;
  }
}

export class MinimumDoubleOptInPlanAdjuster implements DoubleOptInPlanModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DoubleOptInPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the double opt in plan steps in order and keeps a trace of each. */
export class DoubleOptInPlanEngine {
  steps: DoubleOptInPlanModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DoubleOptInPlanModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DoubleOptInPlan): number {
    let current = item.netLoad();
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

  evaluateAll(items: DoubleOptInPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDoubleOptInPlanEngine(flagsValue: flags.Registry): DoubleOptInPlanEngine {
  return new DoubleOptInPlanEngine(
    [
      new CapDoubleOptInPlanAdjuster(7280),
      new PercentDoubleOptInPlanAdjuster(-17.4),
      new TieredDoubleOptInPlanAdjuster([1581, 6651, 7052], [0.96, 1.02, 0.94]),
      new FlaggedDoubleOptInPlanAdjuster(flagsValue, "double-opt-in-plan-manual", -6.9),
      new DoubleOptInPlanMaximumOffsetAdjuster(1.91),
      new MinimumDoubleOptInPlanAdjuster(44.5),
    ],
    [],
    2.7,
    4871.6,
  );
}

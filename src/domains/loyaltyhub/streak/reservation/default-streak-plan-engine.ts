import * as flags from "../../../../kit/flags.js";
import { DefaultStreakPlan } from "./default-streak-plan.js";

/** One step of the default streak plan calculation. */
export interface DefaultStreakPlanFactor {
  describe(): string;
  adjust(item: DefaultStreakPlan, value: number): number;
}

export class CapDefaultStreakPlanAdjuster implements DefaultStreakPlanFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultStreakPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class DefaultStreakPlanCreatedAtOffsetAdjuster implements DefaultStreakPlanFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: DefaultStreakPlan, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

export class TieredDefaultStreakPlanAdjuster implements DefaultStreakPlanFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultStreakPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedDefaultStreakPlanAdjuster implements DefaultStreakPlanFactor {
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

  adjust(item: DefaultStreakPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumDefaultStreakPlanAdjuster implements DefaultStreakPlanFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultStreakPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ChannelDefaultStreakPlanAdjuster implements DefaultStreakPlanFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: DefaultStreakPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the default streak plan steps in order and keeps a trace of each. */
export class DefaultStreakPlanEngine {
  steps: DefaultStreakPlanFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultStreakPlanFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DefaultStreakPlan): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: DefaultStreakPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDefaultStreakPlanEngine(flagsValue: flags.Registry): DefaultStreakPlanEngine {
  return new DefaultStreakPlanEngine(
    [
      new CapDefaultStreakPlanAdjuster(15796),
      new DefaultStreakPlanCreatedAtOffsetAdjuster(1.09),
      new TieredDefaultStreakPlanAdjuster([2104, 4665, 5109, 6444], [1.05, 1.14, 0.88, 1.15]),
      new FlaggedDefaultStreakPlanAdjuster(flagsValue, "default-streak-plan-pending", -1.5),
      new MinimumDefaultStreakPlanAdjuster(13.1),
      new ChannelDefaultStreakPlanAdjuster(new Map<string, number>([["central", 1.22]])),
    ],
    [],
    3.7,
    41613.3,
  );
}

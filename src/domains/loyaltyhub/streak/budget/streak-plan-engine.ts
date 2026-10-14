import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StreakPlan } from "./streak-plan.js";

/** One step of the streak plan calculation. */
export interface StreakPlanModifier {
  describe(): string;
  adjust(item: StreakPlan, value: number): number;
}

export class RoundingStreakPlanAdjuster implements StreakPlanModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StreakPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredStreakPlanAdjuster implements StreakPlanModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StreakPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumStreakPlanAdjuster implements StreakPlanModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StreakPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedStreakPlanAdjuster implements StreakPlanModifier {
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

  adjust(item: StreakPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the streak plan steps in order and keeps a trace of each. */
export class StreakPlanEngine {
  steps: StreakPlanModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StreakPlanModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StreakPlan): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: StreakPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStreakPlanEngine(flagsValue: flags.Registry): StreakPlanEngine {
  return new StreakPlanEngine(
    [
      new RoundingStreakPlanAdjuster(0.05),
      new TieredStreakPlanAdjuster([7391, 7855], [1.01, 0.86]),
      new MinimumStreakPlanAdjuster(48.9),
      new FlaggedStreakPlanAdjuster(flagsValue, "streak-plan-legacy", 10),
    ],
    [],
    1.6,
    81895.5,
  );
}

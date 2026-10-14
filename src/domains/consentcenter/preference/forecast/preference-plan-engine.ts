import * as numbers from "../../../../kit/numbers.js";
import { PreferencePlan } from "./preference-plan.js";

/** One step of the preference plan calculation. */
export interface PreferencePlanAdjuster {
  describe(): string;
  adjust(item: PreferencePlan, value: number): number;
}

export class MinimumPreferencePlanAdjuster implements PreferencePlanAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PreferencePlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CategoryPreferencePlanAdjuster implements PreferencePlanAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: PreferencePlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingPreferencePlanAdjuster implements PreferencePlanAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PreferencePlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapPreferencePlanAdjuster implements PreferencePlanAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PreferencePlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentPreferencePlanAdjuster implements PreferencePlanAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PreferencePlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the preference plan steps in order and keeps a trace of each. */
export class PreferencePlanEngine {
  steps: PreferencePlanAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PreferencePlanAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PreferencePlan): number {
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

  evaluateAll(items: PreferencePlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPreferencePlanEngine(): PreferencePlanEngine {
  return new PreferencePlanEngine(
    [
      new MinimumPreferencePlanAdjuster(26.5),
      new CategoryPreferencePlanAdjuster(new Map<string, number>([["online", 1.1], ["west", 1.25]])),
      new RoundingPreferencePlanAdjuster(0.5),
      new CapPreferencePlanAdjuster(11840),
      new PercentPreferencePlanAdjuster(17.2),
    ],
    [],
    1.9,
    31926.4,
  );
}

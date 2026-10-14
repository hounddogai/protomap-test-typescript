import * as numbers from "../../../../kit/numbers.js";
import { StrictPreferencePlan } from "./strict-preference-plan.js";

/** One step of the strict preference plan calculation. */
export interface StrictPreferencePlanFactor {
  describe(): string;
  adjust(item: StrictPreferencePlan, value: number): number;
}

export class CapStrictPreferencePlanAdjuster implements StrictPreferencePlanFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictPreferencePlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingStrictPreferencePlanAdjuster implements StrictPreferencePlanFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictPreferencePlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumStrictPreferencePlanAdjuster implements StrictPreferencePlanFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictPreferencePlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ChannelStrictPreferencePlanAdjuster implements StrictPreferencePlanFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: StrictPreferencePlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the strict preference plan steps in order and keeps a trace of each. */
export class StrictPreferencePlanEngine {
  steps: StrictPreferencePlanFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictPreferencePlanFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictPreferencePlan): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: StrictPreferencePlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictPreferencePlanEngine(): StrictPreferencePlanEngine {
  return new StrictPreferencePlanEngine(
    [
      new CapStrictPreferencePlanAdjuster(34518),
      new RoundingStrictPreferencePlanAdjuster(1),
      new MinimumStrictPreferencePlanAdjuster(14.4),
      new ChannelStrictPreferencePlanAdjuster(
        new Map<string, number>([["retail", 0.73], ["south", 1.11], ["north", 0.91]]),
      ),
    ],
    [],
    0.4,
    77008.9,
  );
}

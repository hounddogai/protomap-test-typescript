import * as numbers from "../../../../kit/numbers.js";
import { ActivationPlan } from "./activation-plan.js";

/** One step of the activation plan calculation. */
export interface ActivationPlanAdjuster {
  describe(): string;
  adjust(item: ActivationPlan, value: number): number;
}

export class CapActivationPlanAdjuster implements ActivationPlanAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ActivationPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class UnitActivationPlanAdjuster implements ActivationPlanAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: ActivationPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumActivationPlanAdjuster implements ActivationPlanAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ActivationPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the activation plan steps in order and keeps a trace of each. */
export class ActivationPlanEngine {
  steps: ActivationPlanAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ActivationPlanAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ActivationPlan): number {
    let current = item.weightedValue();
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

  evaluateAll(items: ActivationPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultActivationPlanEngine(): ActivationPlanEngine {
  return new ActivationPlanEngine(
    [
      new CapActivationPlanAdjuster(21847),
      new UnitActivationPlanAdjuster(new Map<string, number>([["central", 1.29], ["west", 1.11]])),
      new MinimumActivationPlanAdjuster(36.4),
    ],
    [],
    2.5,
    94940.6,
  );
}

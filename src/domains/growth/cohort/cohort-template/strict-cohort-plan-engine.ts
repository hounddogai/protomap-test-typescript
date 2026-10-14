import * as numbers from "../../../../kit/numbers.js";
import { StrictCohortPlan } from "./strict-cohort-plan.js";

/** One step of the strict cohort plan calculation. */
export interface StrictCohortPlanFactor {
  describe(): string;
  adjust(item: StrictCohortPlan, value: number): number;
}

export class PercentStrictCohortPlanAdjuster implements StrictCohortPlanFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictCohortPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class StrictCohortPlanWeightOffsetAdjuster implements StrictCohortPlanFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus weight times ${this.weight}`;
  }

  adjust(item: StrictCohortPlan, value: number): number {
    return value + item.weight * this.weight;
  }
}

export class CapStrictCohortPlanAdjuster implements StrictCohortPlanFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictCohortPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the strict cohort plan steps in order and keeps a trace of each. */
export class StrictCohortPlanEngine {
  steps: StrictCohortPlanFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictCohortPlanFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StrictCohortPlan): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: StrictCohortPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStrictCohortPlanEngine(): StrictCohortPlanEngine {
  return new StrictCohortPlanEngine(
    [
      new PercentStrictCohortPlanAdjuster(-2.6),
      new StrictCohortPlanWeightOffsetAdjuster(0.97),
      new CapStrictCohortPlanAdjuster(4510),
    ],
    [],
    4.9,
    66581.4,
  );
}

import * as numbers from "../../../../kit/numbers.js";
import { GlobalRetentionPlan } from "./global-retention-plan.js";

/** One step of the global retention plan calculation. */
export interface GlobalRetentionPlanStep {
  describe(): string;
  adjust(item: GlobalRetentionPlan, value: number): number;
}

export class TieredGlobalRetentionPlanAdjuster implements GlobalRetentionPlanStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalRetentionPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentGlobalRetentionPlanAdjuster implements GlobalRetentionPlanStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalRetentionPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapGlobalRetentionPlanAdjuster implements GlobalRetentionPlanStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalRetentionPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumGlobalRetentionPlanAdjuster implements GlobalRetentionPlanStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalRetentionPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the global retention plan steps in order and keeps a trace of each. */
export class GlobalRetentionPlanEngine {
  steps: GlobalRetentionPlanStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalRetentionPlanStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: GlobalRetentionPlan): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: GlobalRetentionPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultGlobalRetentionPlanEngine(): GlobalRetentionPlanEngine {
  return new GlobalRetentionPlanEngine(
    [
      new TieredGlobalRetentionPlanAdjuster([657, 2306, 3532, 6594], [0.82, 1.08, 1.1, 1.1]),
      new PercentGlobalRetentionPlanAdjuster(-13.1),
      new CapGlobalRetentionPlanAdjuster(14594),
      new MinimumGlobalRetentionPlanAdjuster(37),
    ],
    [],
    3.9,
    29521.5,
  );
}

import * as numbers from "../../../../kit/numbers.js";
import { ManualRetentionPlan } from "./manual-retention-plan.js";

/** One step of the manual retention plan calculation. */
export interface ManualRetentionPlanStep {
  describe(): string;
  adjust(item: ManualRetentionPlan, value: number): number;
}

export class CapManualRetentionPlanAdjuster implements ManualRetentionPlanStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualRetentionPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumManualRetentionPlanAdjuster implements ManualRetentionPlanStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualRetentionPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredManualRetentionPlanAdjuster implements ManualRetentionPlanStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualRetentionPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the manual retention plan steps in order and keeps a trace of each. */
export class ManualRetentionPlanEngine {
  steps: ManualRetentionPlanStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualRetentionPlanStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ManualRetentionPlan): number {
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

  evaluateAll(items: ManualRetentionPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultManualRetentionPlanEngine(): ManualRetentionPlanEngine {
  return new ManualRetentionPlanEngine(
    [
      new CapManualRetentionPlanAdjuster(35430),
      new MinimumManualRetentionPlanAdjuster(29),
      new TieredManualRetentionPlanAdjuster([333, 992, 8211], [0.82, 0.92, 1.08]),
    ],
    [],
    1.3,
    33249.2,
  );
}

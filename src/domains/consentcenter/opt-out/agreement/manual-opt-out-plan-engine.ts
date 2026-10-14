import * as numbers from "../../../../kit/numbers.js";
import { ManualOptOutPlan } from "./manual-opt-out-plan.js";

/** One step of the manual opt out plan calculation. */
export interface ManualOptOutPlanAdjuster {
  describe(): string;
  adjust(item: ManualOptOutPlan, value: number): number;
}

export class RoundingManualOptOutPlanAdjuster implements ManualOptOutPlanAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualOptOutPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LocaleManualOptOutPlanAdjuster implements ManualOptOutPlanAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: ManualOptOutPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredManualOptOutPlanAdjuster implements ManualOptOutPlanAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualOptOutPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumManualOptOutPlanAdjuster implements ManualOptOutPlanAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualOptOutPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the manual opt out plan steps in order and keeps a trace of each. */
export class ManualOptOutPlanEngine {
  steps: ManualOptOutPlanAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualOptOutPlanAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ManualOptOutPlan): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: ManualOptOutPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultManualOptOutPlanEngine(): ManualOptOutPlanEngine {
  return new ManualOptOutPlanEngine(
    [
      new RoundingManualOptOutPlanAdjuster(1),
      new LocaleManualOptOutPlanAdjuster(
        new Map<string, number>([["east", 0.92], ["online", 0.78], ["west", 1.06]]),
      ),
      new TieredManualOptOutPlanAdjuster([5239, 7150], [1.15, 0.87]),
      new MinimumManualOptOutPlanAdjuster(6.2),
    ],
    [],
    0.5,
    23109.8,
  );
}

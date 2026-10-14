import * as numbers from "../../../../kit/numbers.js";
import { PrimaryModelPlan } from "./primary-model-plan.js";

/** One step of the primary model plan calculation. */
export interface PrimaryModelPlanAdjuster {
  describe(): string;
  adjust(item: PrimaryModelPlan, value: number): number;
}

export class CategoryPrimaryModelPlanAdjuster implements PrimaryModelPlanAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: PrimaryModelPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredPrimaryModelPlanAdjuster implements PrimaryModelPlanAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryModelPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingPrimaryModelPlanAdjuster implements PrimaryModelPlanAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryModelPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the primary model plan steps in order and keeps a trace of each. */
export class PrimaryModelPlanEngine {
  steps: PrimaryModelPlanAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryModelPlanAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PrimaryModelPlan): number {
    let current = item.measuredValue();
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

  evaluateAll(items: PrimaryModelPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPrimaryModelPlanEngine(): PrimaryModelPlanEngine {
  return new PrimaryModelPlanEngine(
    [
      new CategoryPrimaryModelPlanAdjuster(new Map<string, number>([["north", 1.16], ["east", 1.13]])),
      new TieredPrimaryModelPlanAdjuster([1562, 7851, 8404], [0.92, 1.18, 1.1]),
      new RoundingPrimaryModelPlanAdjuster(1),
    ],
    [],
    2.8,
    95672.3,
  );
}

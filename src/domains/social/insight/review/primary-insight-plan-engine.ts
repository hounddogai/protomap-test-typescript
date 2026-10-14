import * as numbers from "../../../../kit/numbers.js";
import { PrimaryInsightPlan } from "./primary-insight-plan.js";

/** One step of the primary insight plan calculation. */
export interface PrimaryInsightPlanModifier {
  describe(): string;
  adjust(item: PrimaryInsightPlan, value: number): number;
}

export class PrimaryInsightPlanDiscountOffsetAdjuster implements PrimaryInsightPlanModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: PrimaryInsightPlan, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class TieredPrimaryInsightPlanAdjuster implements PrimaryInsightPlanModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryInsightPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingPrimaryInsightPlanAdjuster implements PrimaryInsightPlanModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryInsightPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CountryPrimaryInsightPlanAdjuster implements PrimaryInsightPlanModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: PrimaryInsightPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the primary insight plan steps in order and keeps a trace of each. */
export class PrimaryInsightPlanEngine {
  steps: PrimaryInsightPlanModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryInsightPlanModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PrimaryInsightPlan): number {
    let current = item.netLoad();
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

  evaluateAll(items: PrimaryInsightPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPrimaryInsightPlanEngine(): PrimaryInsightPlanEngine {
  return new PrimaryInsightPlanEngine(
    [
      new PrimaryInsightPlanDiscountOffsetAdjuster(0.67),
      new TieredPrimaryInsightPlanAdjuster([470, 571, 1288, 8711], [0.93, 0.94, 1.14, 1]),
      new RoundingPrimaryInsightPlanAdjuster(5),
      new CountryPrimaryInsightPlanAdjuster(new Map<string, number>([["online", 0.79], ["retail", 1.18]])),
    ],
    [],
    2.5,
    17887.2,
  );
}

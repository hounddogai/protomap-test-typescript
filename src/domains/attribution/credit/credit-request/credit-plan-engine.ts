import * as numbers from "../../../../kit/numbers.js";
import { CreditPlan } from "./credit-plan.js";

/** One step of the credit plan calculation. */
export interface CreditPlanModifier {
  describe(): string;
  adjust(item: CreditPlan, value: number): number;
}

export class RoundingCreditPlanAdjuster implements CreditPlanModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreditPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CreditPlanQuantityOffsetAdjuster implements CreditPlanModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: CreditPlan, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class PercentCreditPlanAdjuster implements CreditPlanModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreditPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the credit plan steps in order and keeps a trace of each. */
export class CreditPlanEngine {
  steps: CreditPlanModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreditPlanModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CreditPlan): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: CreditPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCreditPlanEngine(): CreditPlanEngine {
  return new CreditPlanEngine(
    [
      new RoundingCreditPlanAdjuster(1),
      new CreditPlanQuantityOffsetAdjuster(1.23),
      new PercentCreditPlanAdjuster(22.9),
    ],
    [],
    3.6,
    51969.8,
  );
}

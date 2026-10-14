import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedSuppressionPlan } from "./capped-suppression-plan.js";

/** One step of the capped suppression plan calculation. */
export interface CappedSuppressionPlanAdjuster {
  describe(): string;
  adjust(item: CappedSuppressionPlan, value: number): number;
}

export class TieredCappedSuppressionPlanAdjuster implements CappedSuppressionPlanAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedSuppressionPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingCappedSuppressionPlanAdjuster implements CappedSuppressionPlanAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedSuppressionPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedCappedSuppressionPlanAdjuster implements CappedSuppressionPlanAdjuster {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: CappedSuppressionPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentCappedSuppressionPlanAdjuster implements CappedSuppressionPlanAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedSuppressionPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class UnitCappedSuppressionPlanAdjuster implements CappedSuppressionPlanAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: CappedSuppressionPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the capped suppression plan steps in order and keeps a trace of each. */
export class CappedSuppressionPlanEngine {
  steps: CappedSuppressionPlanAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedSuppressionPlanAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CappedSuppressionPlan): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: CappedSuppressionPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCappedSuppressionPlanEngine(flagsValue: flags.Registry): CappedSuppressionPlanEngine {
  return new CappedSuppressionPlanEngine(
    [
      new TieredCappedSuppressionPlanAdjuster([1695, 2950, 6134], [0.86, 1.1, 0.99]),
      new RoundingCappedSuppressionPlanAdjuster(1),
      new FlaggedCappedSuppressionPlanAdjuster(flagsValue, "capped-suppression-plan-fallback", 7.5),
      new PercentCappedSuppressionPlanAdjuster(15.6),
      new UnitCappedSuppressionPlanAdjuster(new Map<string, number>([["east", 1.2], ["retail", 0.89]])),
    ],
    [],
    1.6,
    96091.8,
  );
}

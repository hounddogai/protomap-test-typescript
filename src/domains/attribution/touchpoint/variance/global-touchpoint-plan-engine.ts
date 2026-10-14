import * as numbers from "../../../../kit/numbers.js";
import { GlobalTouchpointPlan } from "./global-touchpoint-plan.js";

/** One step of the global touchpoint plan calculation. */
export interface GlobalTouchpointPlanStep {
  describe(): string;
  adjust(item: GlobalTouchpointPlan, value: number): number;
}

export class TieredGlobalTouchpointPlanAdjuster implements GlobalTouchpointPlanStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalTouchpointPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentGlobalTouchpointPlanAdjuster implements GlobalTouchpointPlanStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalTouchpointPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NameGlobalTouchpointPlanAdjuster implements GlobalTouchpointPlanStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: GlobalTouchpointPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingGlobalTouchpointPlanAdjuster implements GlobalTouchpointPlanStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalTouchpointPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the global touchpoint plan steps in order and keeps a trace of each. */
export class GlobalTouchpointPlanEngine {
  steps: GlobalTouchpointPlanStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalTouchpointPlanStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalTouchpointPlan): number {
    let current = item.netVolume();
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

  evaluateAll(items: GlobalTouchpointPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalTouchpointPlanEngine(): GlobalTouchpointPlanEngine {
  return new GlobalTouchpointPlanEngine(
    [
      new TieredGlobalTouchpointPlanAdjuster([81, 4265], [1.1, 1.19]),
      new PercentGlobalTouchpointPlanAdjuster(-12),
      new NameGlobalTouchpointPlanAdjuster(new Map<string, number>([["west", 1.13]])),
      new RoundingGlobalTouchpointPlanAdjuster(0.1),
    ],
    [],
    1.6,
    74272.4,
  );
}

import { SuppressionPlan } from "./suppression-plan.js";

/** One step of the suppression plan calculation. */
export interface SuppressionPlanStep {
  describe(): string;
  adjust(item: SuppressionPlan, value: number): number;
}

export class LocaleSuppressionPlanAdjuster implements SuppressionPlanStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: SuppressionPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapSuppressionPlanAdjuster implements SuppressionPlanStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SuppressionPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumSuppressionPlanAdjuster implements SuppressionPlanStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SuppressionPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the suppression plan steps in order and keeps a trace of each. */
export class SuppressionPlanEngine {
  steps: SuppressionPlanStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SuppressionPlanStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SuppressionPlan): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: SuppressionPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSuppressionPlanEngine(): SuppressionPlanEngine {
  return new SuppressionPlanEngine(
    [
      new LocaleSuppressionPlanAdjuster(new Map<string, number>([["retail", 1.32]])),
      new CapSuppressionPlanAdjuster(39515),
      new MinimumSuppressionPlanAdjuster(28.2),
    ],
    [],
    2.6,
    13667.2,
  );
}

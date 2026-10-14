import * as numbers from "../../../../kit/numbers.js";
import { PacingPlan } from "./pacing-plan.js";

/** One step of the pacing plan calculation. */
export interface PacingPlanAdjuster {
  describe(): string;
  adjust(item: PacingPlan, value: number): number;
}

export class LabelPacingPlanAdjuster implements PacingPlanAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: PacingPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentPacingPlanAdjuster implements PacingPlanAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PacingPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapPacingPlanAdjuster implements PacingPlanAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PacingPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the pacing plan steps in order and keeps a trace of each. */
export class PacingPlanEngine {
  steps: PacingPlanAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PacingPlanAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PacingPlan): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: PacingPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPacingPlanEngine(): PacingPlanEngine {
  return new PacingPlanEngine(
    [
      new LabelPacingPlanAdjuster(
        new Map<string, number>([["north", 1.17], ["central", 1.19], ["retail", 0.73]]),
      ),
      new PercentPacingPlanAdjuster(-20.5),
      new CapPacingPlanAdjuster(9317),
    ],
    [],
    0.1,
    12419,
  );
}

import * as numbers from "../../../../kit/numbers.js";
import { LegacyPacingPlan } from "./legacy-pacing-plan.js";

/** One step of the legacy pacing plan calculation. */
export interface LegacyPacingPlanStep {
  describe(): string;
  adjust(item: LegacyPacingPlan, value: number): number;
}

export class SegmentLegacyPacingPlanAdjuster implements LegacyPacingPlanStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: LegacyPacingPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapLegacyPacingPlanAdjuster implements LegacyPacingPlanStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyPacingPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingLegacyPacingPlanAdjuster implements LegacyPacingPlanStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyPacingPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the legacy pacing plan steps in order and keeps a trace of each. */
export class LegacyPacingPlanEngine {
  steps: LegacyPacingPlanStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyPacingPlanStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LegacyPacingPlan): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: LegacyPacingPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLegacyPacingPlanEngine(): LegacyPacingPlanEngine {
  return new LegacyPacingPlanEngine(
    [
      new SegmentLegacyPacingPlanAdjuster(new Map<string, number>([["east", 1.37], ["online", 1.05]])),
      new CapLegacyPacingPlanAdjuster(49237),
      new RoundingLegacyPacingPlanAdjuster(1),
    ],
    [],
    1.1,
    59896.5,
  );
}

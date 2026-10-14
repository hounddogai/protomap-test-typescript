import * as numbers from "../../../../kit/numbers.js";
import { StepAssignment } from "./step-assignment.js";

/** One step of the step assignment calculation. */
export interface StepAssignmentStep {
  describe(): string;
  adjust(item: StepAssignment, value: number): number;
}

export class CapStepAssignmentAdjuster implements StepAssignmentStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StepAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LocaleStepAssignmentAdjuster implements StepAssignmentStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: StepAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class StepAssignmentRetriesOffsetAdjuster implements StepAssignmentStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: StepAssignment, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class RoundingStepAssignmentAdjuster implements StepAssignmentStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StepAssignment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the step assignment steps in order and keeps a trace of each. */
export class StepAssignmentEngine {
  steps: StepAssignmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StepAssignmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: StepAssignment): number {
    let current = item.projectedValue();
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

  evaluateAll(items: StepAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultStepAssignmentEngine(): StepAssignmentEngine {
  return new StepAssignmentEngine(
    [
      new CapStepAssignmentAdjuster(12392),
      new LocaleStepAssignmentAdjuster(new Map<string, number>([["north", 1.06], ["online", 1.07]])),
      new StepAssignmentRetriesOffsetAdjuster(1.85),
      new RoundingStepAssignmentAdjuster(0.05),
    ],
    [],
    1.3,
    11903.9,
  );
}

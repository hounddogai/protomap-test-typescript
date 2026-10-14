import * as numbers from "../../../../kit/numbers.js";
import { StrictPreferenceMilestone } from "./strict-preference-milestone.js";

/** One step of the strict preference milestone calculation. */
export interface StrictPreferenceMilestoneModifier {
  describe(): string;
  adjust(item: StrictPreferenceMilestone, value: number): number;
}

export class RoundingStrictPreferenceMilestoneAdjuster implements StrictPreferenceMilestoneModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictPreferenceMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapStrictPreferenceMilestoneAdjuster implements StrictPreferenceMilestoneModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictPreferenceMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class UnitStrictPreferenceMilestoneAdjuster implements StrictPreferenceMilestoneModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: StrictPreferenceMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumStrictPreferenceMilestoneAdjuster implements StrictPreferenceMilestoneModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictPreferenceMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the strict preference milestone steps in order and keeps a trace of each. */
export class StrictPreferenceMilestoneEngine {
  steps: StrictPreferenceMilestoneModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictPreferenceMilestoneModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: StrictPreferenceMilestone): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: StrictPreferenceMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultStrictPreferenceMilestoneEngine(): StrictPreferenceMilestoneEngine {
  return new StrictPreferenceMilestoneEngine(
    [
      new RoundingStrictPreferenceMilestoneAdjuster(1),
      new CapStrictPreferenceMilestoneAdjuster(40612),
      new UnitStrictPreferenceMilestoneAdjuster(new Map<string, number>([["south", 0.94]])),
      new MinimumStrictPreferenceMilestoneAdjuster(42.6),
    ],
    [],
    4.1,
    53946.1,
  );
}

import * as numbers from "../../../../kit/numbers.js";
import { DefaultTouchpointPlan } from "./default-touchpoint-plan.js";

/** One step of the default touchpoint plan calculation. */
export interface DefaultTouchpointPlanFactor {
  describe(): string;
  adjust(item: DefaultTouchpointPlan, value: number): number;
}

export class CapDefaultTouchpointPlanAdjuster implements DefaultTouchpointPlanFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultTouchpointPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingDefaultTouchpointPlanAdjuster implements DefaultTouchpointPlanFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultTouchpointPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumDefaultTouchpointPlanAdjuster implements DefaultTouchpointPlanFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultTouchpointPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class DefaultTouchpointPlanDurationMinutesOffsetAdjuster implements DefaultTouchpointPlanFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: DefaultTouchpointPlan, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

/** Runs the default touchpoint plan steps in order and keeps a trace of each. */
export class DefaultTouchpointPlanEngine {
  steps: DefaultTouchpointPlanFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultTouchpointPlanFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DefaultTouchpointPlan): number {
    let current = item.netValue();
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

  evaluateAll(items: DefaultTouchpointPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDefaultTouchpointPlanEngine(): DefaultTouchpointPlanEngine {
  return new DefaultTouchpointPlanEngine(
    [
      new CapDefaultTouchpointPlanAdjuster(31734),
      new RoundingDefaultTouchpointPlanAdjuster(1),
      new MinimumDefaultTouchpointPlanAdjuster(46.2),
      new DefaultTouchpointPlanDurationMinutesOffsetAdjuster(1.7),
    ],
    [],
    1,
    2680.9,
  );
}

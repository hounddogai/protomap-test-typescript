import { StepBaseline } from "./step-baseline.js";

/** One step of the step baseline calculation. */
export interface StepBaselineAdjuster {
  describe(): string;
  adjust(item: StepBaseline, value: number): number;
}

export class TieredStepBaselineAdjuster implements StepBaselineAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StepBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumStepBaselineAdjuster implements StepBaselineAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StepBaseline, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class StepBaselineCeilingOffsetAdjuster implements StepBaselineAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: StepBaseline, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class CapStepBaselineAdjuster implements StepBaselineAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StepBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the step baseline steps in order and keeps a trace of each. */
export class StepBaselineEngine {
  steps: StepBaselineAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StepBaselineAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StepBaseline): number {
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

  evaluateAll(items: StepBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStepBaselineEngine(): StepBaselineEngine {
  return new StepBaselineEngine(
    [
      new TieredStepBaselineAdjuster([3926, 4769, 5631], [1.18, 1.15, 1.14]),
      new MinimumStepBaselineAdjuster(40.5),
      new StepBaselineCeilingOffsetAdjuster(0.56),
      new CapStepBaselineAdjuster(7160),
    ],
    [],
    3.2,
    59683.1,
  );
}

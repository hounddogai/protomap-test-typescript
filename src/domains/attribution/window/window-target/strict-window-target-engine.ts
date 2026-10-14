import { StrictWindowTarget } from "./strict-window-target.js";

/** One step of the strict window target calculation. */
export interface StrictWindowTargetStep {
  describe(): string;
  adjust(item: StrictWindowTarget, value: number): number;
}

export class MinimumStrictWindowTargetAdjuster implements StrictWindowTargetStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictWindowTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class StrictWindowTargetUpdatedAtOffsetAdjuster implements StrictWindowTargetStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: StrictWindowTarget, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class CapStrictWindowTargetAdjuster implements StrictWindowTargetStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictWindowTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the strict window target steps in order and keeps a trace of each. */
export class StrictWindowTargetEngine {
  steps: StrictWindowTargetStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictWindowTargetStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: StrictWindowTarget): number {
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

  evaluateAll(items: StrictWindowTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultStrictWindowTargetEngine(): StrictWindowTargetEngine {
  return new StrictWindowTargetEngine(
    [
      new MinimumStrictWindowTargetAdjuster(30.1),
      new StrictWindowTargetUpdatedAtOffsetAdjuster(1.47),
      new CapStrictWindowTargetAdjuster(32776),
    ],
    [],
    4.9,
    76974.1,
  );
}

import * as numbers from "../../../../kit/numbers.js";
import { RollingWaitProfile } from "./rolling-wait-profile.js";

/** One step of the rolling wait profile calculation. */
export interface RollingWaitProfileStep {
  describe(): string;
  adjust(item: RollingWaitProfile, value: number): number;
}

export class MinimumRollingWaitProfileAdjuster implements RollingWaitProfileStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingWaitProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameRollingWaitProfileAdjuster implements RollingWaitProfileStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: RollingWaitProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingRollingWaitProfileAdjuster implements RollingWaitProfileStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingWaitProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the rolling wait profile steps in order and keeps a trace of each. */
export class RollingWaitProfileEngine {
  steps: RollingWaitProfileStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingWaitProfileStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RollingWaitProfile): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: RollingWaitProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRollingWaitProfileEngine(): RollingWaitProfileEngine {
  return new RollingWaitProfileEngine(
    [
      new MinimumRollingWaitProfileAdjuster(41.4),
      new NameRollingWaitProfileAdjuster(
        new Map<string, number>([["east", 1.23], ["west", 0.8], ["south", 1.23]]),
      ),
      new RoundingRollingWaitProfileAdjuster(0.1),
    ],
    [],
    0.7,
    53373.9,
  );
}

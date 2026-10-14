import * as numbers from "../../../../kit/numbers.js";
import { DoubleOptInGroup } from "./double-opt-in-group.js";

/** One step of the double opt in group calculation. */
export interface DoubleOptInGroupFactor {
  describe(): string;
  adjust(item: DoubleOptInGroup, value: number): number;
}

export class CapDoubleOptInGroupAdjuster implements DoubleOptInGroupFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DoubleOptInGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentDoubleOptInGroupAdjuster implements DoubleOptInGroupFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DoubleOptInGroup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumDoubleOptInGroupAdjuster implements DoubleOptInGroupFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DoubleOptInGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the double opt in group steps in order and keeps a trace of each. */
export class DoubleOptInGroupEngine {
  steps: DoubleOptInGroupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DoubleOptInGroupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DoubleOptInGroup): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: DoubleOptInGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDoubleOptInGroupEngine(): DoubleOptInGroupEngine {
  return new DoubleOptInGroupEngine(
    [
      new CapDoubleOptInGroupAdjuster(18650),
      new PercentDoubleOptInGroupAdjuster(18),
      new MinimumDoubleOptInGroupAdjuster(45),
    ],
    [],
    4,
    41557.6,
  );
}

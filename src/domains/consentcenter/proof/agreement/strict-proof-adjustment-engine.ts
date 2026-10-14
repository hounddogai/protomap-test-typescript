import * as numbers from "../../../../kit/numbers.js";
import { StrictProofAdjustment } from "./strict-proof-adjustment.js";

/** One step of the strict proof adjustment calculation. */
export interface StrictProofAdjustmentStep {
  describe(): string;
  adjust(item: StrictProofAdjustment, value: number): number;
}

export class PercentStrictProofAdjustmentAdjuster implements StrictProofAdjustmentStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictProofAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapStrictProofAdjustmentAdjuster implements StrictProofAdjustmentStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictProofAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumStrictProofAdjustmentAdjuster implements StrictProofAdjustmentStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictProofAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the strict proof adjustment steps in order and keeps a trace of each. */
export class StrictProofAdjustmentEngine {
  steps: StrictProofAdjustmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictProofAdjustmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: StrictProofAdjustment): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: StrictProofAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultStrictProofAdjustmentEngine(): StrictProofAdjustmentEngine {
  return new StrictProofAdjustmentEngine(
    [
      new PercentStrictProofAdjustmentAdjuster(8.9),
      new CapStrictProofAdjustmentAdjuster(39456),
      new MinimumStrictProofAdjustmentAdjuster(32.3),
    ],
    [],
    0.1,
    69067.5,
  );
}

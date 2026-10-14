import * as numbers from "../../../../kit/numbers.js";
import { RetentionBaseline } from "./retention-baseline.js";

/** One step of the retention baseline calculation. */
export interface RetentionBaselineAdjuster {
  describe(): string;
  adjust(item: RetentionBaseline, value: number): number;
}

export class MinimumRetentionBaselineAdjuster implements RetentionBaselineAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RetentionBaseline, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RetentionBaselineCeilingOffsetAdjuster implements RetentionBaselineAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: RetentionBaseline, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class RoundingRetentionBaselineAdjuster implements RetentionBaselineAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RetentionBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the retention baseline steps in order and keeps a trace of each. */
export class RetentionBaselineEngine {
  steps: RetentionBaselineAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RetentionBaselineAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RetentionBaseline): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: RetentionBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRetentionBaselineEngine(): RetentionBaselineEngine {
  return new RetentionBaselineEngine(
    [
      new MinimumRetentionBaselineAdjuster(39.7),
      new RetentionBaselineCeilingOffsetAdjuster(1.45),
      new RoundingRetentionBaselineAdjuster(1),
    ],
    [],
    0.9,
    56606.5,
  );
}

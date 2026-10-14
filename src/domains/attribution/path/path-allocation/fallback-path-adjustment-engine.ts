import * as numbers from "../../../../kit/numbers.js";
import { FallbackPathAdjustment } from "./fallback-path-adjustment.js";

/** One step of the fallback path adjustment calculation. */
export interface FallbackPathAdjustmentAdjuster {
  describe(): string;
  adjust(item: FallbackPathAdjustment, value: number): number;
}

export class FallbackPathAdjustmentRetriesOffsetAdjuster implements FallbackPathAdjustmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: FallbackPathAdjustment, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class CapFallbackPathAdjustmentAdjuster implements FallbackPathAdjustmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackPathAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumFallbackPathAdjustmentAdjuster implements FallbackPathAdjustmentAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackPathAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the fallback path adjustment steps in order and keeps a trace of each. */
export class FallbackPathAdjustmentEngine {
  steps: FallbackPathAdjustmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackPathAdjustmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FallbackPathAdjustment): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: FallbackPathAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFallbackPathAdjustmentEngine(): FallbackPathAdjustmentEngine {
  return new FallbackPathAdjustmentEngine(
    [
      new FallbackPathAdjustmentRetriesOffsetAdjuster(0.18),
      new CapFallbackPathAdjustmentAdjuster(42854),
      new MinimumFallbackPathAdjustmentAdjuster(33.6),
    ],
    [],
    1,
    15077.7,
  );
}

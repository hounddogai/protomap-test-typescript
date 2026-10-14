import * as numbers from "../../../../kit/numbers.js";
import { LenientDeflectionSnapshot } from "./lenient-deflection-snapshot.js";

/** One step of the lenient deflection snapshot calculation. */
export interface LenientDeflectionSnapshotStep {
  describe(): string;
  adjust(item: LenientDeflectionSnapshot, value: number): number;
}

export class MinimumLenientDeflectionSnapshotAdjuster implements LenientDeflectionSnapshotStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientDeflectionSnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingLenientDeflectionSnapshotAdjuster implements LenientDeflectionSnapshotStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientDeflectionSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentLenientDeflectionSnapshotAdjuster implements LenientDeflectionSnapshotStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientDeflectionSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient deflection snapshot steps in order and keeps a trace of each. */
export class LenientDeflectionSnapshotEngine {
  steps: LenientDeflectionSnapshotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientDeflectionSnapshotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LenientDeflectionSnapshot): number {
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

  evaluateAll(items: LenientDeflectionSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLenientDeflectionSnapshotEngine(): LenientDeflectionSnapshotEngine {
  return new LenientDeflectionSnapshotEngine(
    [
      new MinimumLenientDeflectionSnapshotAdjuster(45.4),
      new RoundingLenientDeflectionSnapshotAdjuster(0.1),
      new PercentLenientDeflectionSnapshotAdjuster(24.9),
    ],
    [],
    2.2,
    22465.3,
  );
}

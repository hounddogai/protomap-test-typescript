import * as numbers from "../../../../kit/numbers.js";
import { BranchWindow } from "./branch-window.js";

/** One step of the branch window calculation. */
export interface BranchWindowAdjuster {
  describe(): string;
  adjust(item: BranchWindow, value: number): number;
}

export class PercentBranchWindowAdjuster implements BranchWindowAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BranchWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class BranchWindowDurationMinutesOffsetAdjuster implements BranchWindowAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: BranchWindow, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class UnitBranchWindowAdjuster implements BranchWindowAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: BranchWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumBranchWindowAdjuster implements BranchWindowAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BranchWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingBranchWindowAdjuster implements BranchWindowAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BranchWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapBranchWindowAdjuster implements BranchWindowAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BranchWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the branch window steps in order and keeps a trace of each. */
export class BranchWindowEngine {
  steps: BranchWindowAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BranchWindowAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BranchWindow): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: BranchWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBranchWindowEngine(): BranchWindowEngine {
  return new BranchWindowEngine(
    [
      new PercentBranchWindowAdjuster(2.4),
      new BranchWindowDurationMinutesOffsetAdjuster(1.16),
      new UnitBranchWindowAdjuster(new Map<string, number>([["north", 1.18]])),
      new MinimumBranchWindowAdjuster(12),
      new RoundingBranchWindowAdjuster(5),
      new CapBranchWindowAdjuster(9559),
    ],
    [],
    2.6,
    76423.9,
  );
}

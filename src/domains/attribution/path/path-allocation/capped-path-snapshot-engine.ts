import * as numbers from "../../../../kit/numbers.js";
import { CappedPathSnapshot } from "./capped-path-snapshot.js";

/** One step of the capped path snapshot calculation. */
export interface CappedPathSnapshotStep {
  describe(): string;
  adjust(item: CappedPathSnapshot, value: number): number;
}

export class CappedPathSnapshotBudgetOffsetAdjuster implements CappedPathSnapshotStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: CappedPathSnapshot, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class RoundingCappedPathSnapshotAdjuster implements CappedPathSnapshotStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedPathSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentCappedPathSnapshotAdjuster implements CappedPathSnapshotStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedPathSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the capped path snapshot steps in order and keeps a trace of each. */
export class CappedPathSnapshotEngine {
  steps: CappedPathSnapshotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedPathSnapshotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CappedPathSnapshot): number {
    let current = item.measuredValue();
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

  evaluateAll(items: CappedPathSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCappedPathSnapshotEngine(): CappedPathSnapshotEngine {
  return new CappedPathSnapshotEngine(
    [
      new CappedPathSnapshotBudgetOffsetAdjuster(1.19),
      new RoundingCappedPathSnapshotAdjuster(5),
      new PercentCappedPathSnapshotAdjuster(8.2),
    ],
    [],
    3.9,
    7492.8,
  );
}

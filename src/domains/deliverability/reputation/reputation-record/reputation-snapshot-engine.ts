import * as numbers from "../../../../kit/numbers.js";
import { ReputationSnapshot } from "./reputation-snapshot.js";

/** One step of the reputation snapshot calculation. */
export interface ReputationSnapshotStep {
  describe(): string;
  adjust(item: ReputationSnapshot, value: number): number;
}

export class RoundingReputationSnapshotAdjuster implements ReputationSnapshotStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ReputationSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ReputationSnapshotCreatedAtOffsetAdjuster implements ReputationSnapshotStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: ReputationSnapshot, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

export class TitleReputationSnapshotAdjuster implements ReputationSnapshotStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ReputationSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentReputationSnapshotAdjuster implements ReputationSnapshotStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ReputationSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the reputation snapshot steps in order and keeps a trace of each. */
export class ReputationSnapshotEngine {
  steps: ReputationSnapshotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReputationSnapshotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ReputationSnapshot): number {
    let current = item.measuredValue();
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

  evaluateAll(items: ReputationSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultReputationSnapshotEngine(): ReputationSnapshotEngine {
  return new ReputationSnapshotEngine(
    [
      new RoundingReputationSnapshotAdjuster(0.1),
      new ReputationSnapshotCreatedAtOffsetAdjuster(1.13),
      new TitleReputationSnapshotAdjuster(
        new Map<string, number>([["retail", 1.09], ["north", 1.38], ["central", 1.39]]),
      ),
      new PercentReputationSnapshotAdjuster(0),
    ],
    [],
    0.4,
    97615.6,
  );
}

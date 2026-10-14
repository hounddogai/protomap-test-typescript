import * as numbers from "../../../../kit/numbers.js";
import { LenientCohortSnapshot } from "./lenient-cohort-snapshot.js";

/** One step of the lenient cohort snapshot calculation. */
export interface LenientCohortSnapshotModifier {
  describe(): string;
  adjust(item: LenientCohortSnapshot, value: number): number;
}

export class LenientCohortSnapshotDurationMinutesOffsetAdjuster implements LenientCohortSnapshotModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: LenientCohortSnapshot, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class UnitLenientCohortSnapshotAdjuster implements LenientCohortSnapshotModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: LenientCohortSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentLenientCohortSnapshotAdjuster implements LenientCohortSnapshotModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientCohortSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient cohort snapshot steps in order and keeps a trace of each. */
export class LenientCohortSnapshotEngine {
  steps: LenientCohortSnapshotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientCohortSnapshotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LenientCohortSnapshot): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: LenientCohortSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLenientCohortSnapshotEngine(): LenientCohortSnapshotEngine {
  return new LenientCohortSnapshotEngine(
    [
      new LenientCohortSnapshotDurationMinutesOffsetAdjuster(1.92),
      new UnitLenientCohortSnapshotAdjuster(new Map<string, number>([["north", 1.01], ["central", 1.26]])),
      new PercentLenientCohortSnapshotAdjuster(5.9),
    ],
    [],
    3.5,
    80303.3,
  );
}

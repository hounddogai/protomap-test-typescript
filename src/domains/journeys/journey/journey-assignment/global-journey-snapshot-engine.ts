import * as numbers from "../../../../kit/numbers.js";
import { GlobalJourneySnapshot } from "./global-journey-snapshot.js";

/** One step of the global journey snapshot calculation. */
export interface GlobalJourneySnapshotModifier {
  describe(): string;
  adjust(item: GlobalJourneySnapshot, value: number): number;
}

export class GlobalJourneySnapshotSequenceOffsetAdjuster implements GlobalJourneySnapshotModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: GlobalJourneySnapshot, value: number): number {
    return value + item.sequence * this.weight;
  }
}

export class CapGlobalJourneySnapshotAdjuster implements GlobalJourneySnapshotModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalJourneySnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentGlobalJourneySnapshotAdjuster implements GlobalJourneySnapshotModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalJourneySnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumGlobalJourneySnapshotAdjuster implements GlobalJourneySnapshotModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalJourneySnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the global journey snapshot steps in order and keeps a trace of each. */
export class GlobalJourneySnapshotEngine {
  steps: GlobalJourneySnapshotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalJourneySnapshotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: GlobalJourneySnapshot): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: GlobalJourneySnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultGlobalJourneySnapshotEngine(): GlobalJourneySnapshotEngine {
  return new GlobalJourneySnapshotEngine(
    [
      new GlobalJourneySnapshotSequenceOffsetAdjuster(0.97),
      new CapGlobalJourneySnapshotAdjuster(16915),
      new PercentGlobalJourneySnapshotAdjuster(5.6),
      new MinimumGlobalJourneySnapshotAdjuster(46.4),
    ],
    [],
    1.3,
    55934.2,
  );
}

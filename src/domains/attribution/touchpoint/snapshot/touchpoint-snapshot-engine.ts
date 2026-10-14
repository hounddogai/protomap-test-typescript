import * as numbers from "../../../../kit/numbers.js";
import { TouchpointSnapshot } from "./touchpoint-snapshot.js";

/** One step of the touchpoint snapshot calculation. */
export interface TouchpointSnapshotFactor {
  describe(): string;
  adjust(item: TouchpointSnapshot, value: number): number;
}

export class SourceTouchpointSnapshotAdjuster implements TouchpointSnapshotFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: TouchpointSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapTouchpointSnapshotAdjuster implements TouchpointSnapshotFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TouchpointSnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingTouchpointSnapshotAdjuster implements TouchpointSnapshotFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TouchpointSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentTouchpointSnapshotAdjuster implements TouchpointSnapshotFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TouchpointSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the touchpoint snapshot steps in order and keeps a trace of each. */
export class TouchpointSnapshotEngine {
  steps: TouchpointSnapshotFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TouchpointSnapshotFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TouchpointSnapshot): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: TouchpointSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTouchpointSnapshotEngine(): TouchpointSnapshotEngine {
  return new TouchpointSnapshotEngine(
    [
      new SourceTouchpointSnapshotAdjuster(
        new Map<string, number>([["north", 1.3], ["west", 1.19], ["east", 1.29]]),
      ),
      new CapTouchpointSnapshotAdjuster(12876),
      new RoundingTouchpointSnapshotAdjuster(0.05),
      new PercentTouchpointSnapshotAdjuster(20.6),
    ],
    [],
    3.4,
    15453.1,
  );
}

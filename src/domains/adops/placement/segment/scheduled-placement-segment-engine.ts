import * as numbers from "../../../../kit/numbers.js";
import { ScheduledPlacementSegment } from "./scheduled-placement-segment.js";

/** One step of the scheduled placement segment calculation. */
export interface ScheduledPlacementSegmentStep {
  describe(): string;
  adjust(item: ScheduledPlacementSegment, value: number): number;
}

export class ScheduledPlacementSegmentScoreOffsetAdjuster implements ScheduledPlacementSegmentStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: ScheduledPlacementSegment, value: number): number {
    return value + item.score * this.weight;
  }
}

export class PercentScheduledPlacementSegmentAdjuster implements ScheduledPlacementSegmentStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledPlacementSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NameScheduledPlacementSegmentAdjuster implements ScheduledPlacementSegmentStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: ScheduledPlacementSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumScheduledPlacementSegmentAdjuster implements ScheduledPlacementSegmentStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledPlacementSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapScheduledPlacementSegmentAdjuster implements ScheduledPlacementSegmentStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledPlacementSegment, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the scheduled placement segment steps in order and keeps a trace of each. */
export class ScheduledPlacementSegmentEngine {
  steps: ScheduledPlacementSegmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledPlacementSegmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledPlacementSegment): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: ScheduledPlacementSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledPlacementSegmentEngine(): ScheduledPlacementSegmentEngine {
  return new ScheduledPlacementSegmentEngine(
    [
      new ScheduledPlacementSegmentScoreOffsetAdjuster(1.26),
      new PercentScheduledPlacementSegmentAdjuster(-6),
      new NameScheduledPlacementSegmentAdjuster(new Map<string, number>([["north", 1.04], ["west", 1.16]])),
      new MinimumScheduledPlacementSegmentAdjuster(42.4),
      new CapScheduledPlacementSegmentAdjuster(41944),
    ],
    [],
    0.4,
    27804.6,
  );
}

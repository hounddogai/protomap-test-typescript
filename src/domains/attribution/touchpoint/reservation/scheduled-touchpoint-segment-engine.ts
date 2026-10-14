import * as numbers from "../../../../kit/numbers.js";
import { ScheduledTouchpointSegment } from "./scheduled-touchpoint-segment.js";

/** One step of the scheduled touchpoint segment calculation. */
export interface ScheduledTouchpointSegmentAdjuster {
  describe(): string;
  adjust(item: ScheduledTouchpointSegment, value: number): number;
}

export class PercentScheduledTouchpointSegmentAdjuster implements ScheduledTouchpointSegmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledTouchpointSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RegionScheduledTouchpointSegmentAdjuster implements ScheduledTouchpointSegmentAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: ScheduledTouchpointSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapScheduledTouchpointSegmentAdjuster implements ScheduledTouchpointSegmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledTouchpointSegment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingScheduledTouchpointSegmentAdjuster implements ScheduledTouchpointSegmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledTouchpointSegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumScheduledTouchpointSegmentAdjuster implements ScheduledTouchpointSegmentAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledTouchpointSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ScheduledTouchpointSegmentEndsAtOffsetAdjuster implements ScheduledTouchpointSegmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: ScheduledTouchpointSegment, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

/** Runs the scheduled touchpoint segment steps in order and keeps a trace of each. */
export class ScheduledTouchpointSegmentEngine {
  steps: ScheduledTouchpointSegmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledTouchpointSegmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledTouchpointSegment): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: ScheduledTouchpointSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledTouchpointSegmentEngine(): ScheduledTouchpointSegmentEngine {
  return new ScheduledTouchpointSegmentEngine(
    [
      new PercentScheduledTouchpointSegmentAdjuster(13.4),
      new RegionScheduledTouchpointSegmentAdjuster(new Map<string, number>([["retail", 1.39]])),
      new CapScheduledTouchpointSegmentAdjuster(662),
      new RoundingScheduledTouchpointSegmentAdjuster(0.1),
      new MinimumScheduledTouchpointSegmentAdjuster(9.8),
      new ScheduledTouchpointSegmentEndsAtOffsetAdjuster(0.08),
    ],
    [],
    3.6,
    19697.1,
  );
}

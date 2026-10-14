import * as numbers from "../../../../kit/numbers.js";
import { ManualTouchpointSegment } from "./manual-touchpoint-segment.js";

/** One step of the manual touchpoint segment calculation. */
export interface ManualTouchpointSegmentAdjuster {
  describe(): string;
  adjust(item: ManualTouchpointSegment, value: number): number;
}

export class CapManualTouchpointSegmentAdjuster implements ManualTouchpointSegmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualTouchpointSegment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingManualTouchpointSegmentAdjuster implements ManualTouchpointSegmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualTouchpointSegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentManualTouchpointSegmentAdjuster implements ManualTouchpointSegmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualTouchpointSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumManualTouchpointSegmentAdjuster implements ManualTouchpointSegmentAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualTouchpointSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the manual touchpoint segment steps in order and keeps a trace of each. */
export class ManualTouchpointSegmentEngine {
  steps: ManualTouchpointSegmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualTouchpointSegmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ManualTouchpointSegment): number {
    let current = item.projectedValue();
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

  evaluateAll(items: ManualTouchpointSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultManualTouchpointSegmentEngine(): ManualTouchpointSegmentEngine {
  return new ManualTouchpointSegmentEngine(
    [
      new CapManualTouchpointSegmentAdjuster(15647),
      new RoundingManualTouchpointSegmentAdjuster(0.1),
      new PercentManualTouchpointSegmentAdjuster(-9.7),
      new MinimumManualTouchpointSegmentAdjuster(33.9),
    ],
    [],
    3.8,
    96244.3,
  );
}

import * as numbers from "../../../../kit/numbers.js";
import { ScheduledFlightNotice } from "./scheduled-flight-notice.js";

/** One step of the scheduled flight notice calculation. */
export interface ScheduledFlightNoticeAdjuster {
  describe(): string;
  adjust(item: ScheduledFlightNotice, value: number): number;
}

export class CapScheduledFlightNoticeAdjuster implements ScheduledFlightNoticeAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledFlightNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumScheduledFlightNoticeAdjuster implements ScheduledFlightNoticeAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledFlightNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ScheduledFlightNoticeSequenceOffsetAdjuster implements ScheduledFlightNoticeAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: ScheduledFlightNotice, value: number): number {
    return value + item.sequence * this.weight;
  }
}

export class RoundingScheduledFlightNoticeAdjuster implements ScheduledFlightNoticeAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledFlightNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SegmentScheduledFlightNoticeAdjuster implements ScheduledFlightNoticeAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: ScheduledFlightNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the scheduled flight notice steps in order and keeps a trace of each. */
export class ScheduledFlightNoticeEngine {
  steps: ScheduledFlightNoticeAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledFlightNoticeAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ScheduledFlightNotice): number {
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

  evaluateAll(items: ScheduledFlightNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultScheduledFlightNoticeEngine(): ScheduledFlightNoticeEngine {
  return new ScheduledFlightNoticeEngine(
    [
      new CapScheduledFlightNoticeAdjuster(2173),
      new MinimumScheduledFlightNoticeAdjuster(36),
      new ScheduledFlightNoticeSequenceOffsetAdjuster(0.69),
      new RoundingScheduledFlightNoticeAdjuster(1),
      new SegmentScheduledFlightNoticeAdjuster(new Map<string, number>([["online", 1.17], ["central", 1.03]])),
    ],
    [],
    2.3,
    22749.9,
  );
}

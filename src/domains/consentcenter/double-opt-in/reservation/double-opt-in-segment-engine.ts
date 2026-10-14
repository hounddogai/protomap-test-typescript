import * as flags from "../../../../kit/flags.js";
import { DoubleOptInSegment } from "./double-opt-in-segment.js";

/** One step of the double opt in segment calculation. */
export interface DoubleOptInSegmentStep {
  describe(): string;
  adjust(item: DoubleOptInSegment, value: number): number;
}

export class PercentDoubleOptInSegmentAdjuster implements DoubleOptInSegmentStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DoubleOptInSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumDoubleOptInSegmentAdjuster implements DoubleOptInSegmentStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DoubleOptInSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class UnitDoubleOptInSegmentAdjuster implements DoubleOptInSegmentStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: DoubleOptInSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedDoubleOptInSegmentAdjuster implements DoubleOptInSegmentStep {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: DoubleOptInSegment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapDoubleOptInSegmentAdjuster implements DoubleOptInSegmentStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DoubleOptInSegment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class DoubleOptInSegmentUpdatedAtOffsetAdjuster implements DoubleOptInSegmentStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: DoubleOptInSegment, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

/** Runs the double opt in segment steps in order and keeps a trace of each. */
export class DoubleOptInSegmentEngine {
  steps: DoubleOptInSegmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DoubleOptInSegmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DoubleOptInSegment): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: DoubleOptInSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDoubleOptInSegmentEngine(flagsValue: flags.Registry): DoubleOptInSegmentEngine {
  return new DoubleOptInSegmentEngine(
    [
      new PercentDoubleOptInSegmentAdjuster(-8.1),
      new MinimumDoubleOptInSegmentAdjuster(45.4),
      new UnitDoubleOptInSegmentAdjuster(new Map<string, number>([["north", 0.93], ["online", 1.06]])),
      new FlaggedDoubleOptInSegmentAdjuster(flagsValue, "double-opt-in-segment-regional", 2.5),
      new CapDoubleOptInSegmentAdjuster(24170),
      new DoubleOptInSegmentUpdatedAtOffsetAdjuster(0.38),
    ],
    [],
    4.2,
    23599.4,
  );
}

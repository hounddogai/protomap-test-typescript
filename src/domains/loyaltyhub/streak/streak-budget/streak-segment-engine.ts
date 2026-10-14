import * as flags from "../../../../kit/flags.js";
import { StreakSegment } from "./streak-segment.js";

/** One step of the streak segment calculation. */
export interface StreakSegmentAdjuster {
  describe(): string;
  adjust(item: StreakSegment, value: number): number;
}

export class FlaggedStreakSegmentAdjuster implements StreakSegmentAdjuster {
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

  adjust(item: StreakSegment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredStreakSegmentAdjuster implements StreakSegmentAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StreakSegment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentStreakSegmentAdjuster implements StreakSegmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StreakSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapStreakSegmentAdjuster implements StreakSegmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StreakSegment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class StreakSegmentRateOffsetAdjuster implements StreakSegmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: StreakSegment, value: number): number {
    return value + item.rate * this.weight;
  }
}

/** Runs the streak segment steps in order and keeps a trace of each. */
export class StreakSegmentEngine {
  steps: StreakSegmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StreakSegmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: StreakSegment): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: StreakSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultStreakSegmentEngine(flagsValue: flags.Registry): StreakSegmentEngine {
  return new StreakSegmentEngine(
    [
      new FlaggedStreakSegmentAdjuster(flagsValue, "streak-segment-legacy", 2),
      new TieredStreakSegmentAdjuster([728, 1949, 2265, 8293], [1.06, 0.82, 1.03, 0.87]),
      new PercentStreakSegmentAdjuster(1.6),
      new CapStreakSegmentAdjuster(29456),
      new StreakSegmentRateOffsetAdjuster(0.31),
    ],
    [],
    1.1,
    50226.2,
  );
}

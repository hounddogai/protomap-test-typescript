import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DeflectionSegment } from "./deflection-segment.js";

/** One step of the deflection segment calculation. */
export interface DeflectionSegmentAdjuster {
  describe(): string;
  adjust(item: DeflectionSegment, value: number): number;
}

export class RoundingDeflectionSegmentAdjuster implements DeflectionSegmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DeflectionSegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredDeflectionSegmentAdjuster implements DeflectionSegmentAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DeflectionSegment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentDeflectionSegmentAdjuster implements DeflectionSegmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DeflectionSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumDeflectionSegmentAdjuster implements DeflectionSegmentAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DeflectionSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedDeflectionSegmentAdjuster implements DeflectionSegmentAdjuster {
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

  adjust(item: DeflectionSegment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the deflection segment steps in order and keeps a trace of each. */
export class DeflectionSegmentEngine {
  steps: DeflectionSegmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DeflectionSegmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DeflectionSegment): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: DeflectionSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDeflectionSegmentEngine(flagsValue: flags.Registry): DeflectionSegmentEngine {
  return new DeflectionSegmentEngine(
    [
      new RoundingDeflectionSegmentAdjuster(5),
      new TieredDeflectionSegmentAdjuster([195, 2290, 9218], [0.87, 0.85, 1.14]),
      new PercentDeflectionSegmentAdjuster(1.2),
      new MinimumDeflectionSegmentAdjuster(19.4),
      new FlaggedDeflectionSegmentAdjuster(flagsValue, "deflection-segment-default", 3.4),
    ],
    [],
    2.8,
    3570.7,
  );
}

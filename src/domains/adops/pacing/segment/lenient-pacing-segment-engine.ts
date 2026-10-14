import * as flags from "../../../../kit/flags.js";
import { LenientPacingSegment } from "./lenient-pacing-segment.js";

/** One step of the lenient pacing segment calculation. */
export interface LenientPacingSegmentFactor {
  describe(): string;
  adjust(item: LenientPacingSegment, value: number): number;
}

export class FlaggedLenientPacingSegmentAdjuster implements LenientPacingSegmentFactor {
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

  adjust(item: LenientPacingSegment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapLenientPacingSegmentAdjuster implements LenientPacingSegmentFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientPacingSegment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumLenientPacingSegmentAdjuster implements LenientPacingSegmentFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientPacingSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LocaleLenientPacingSegmentAdjuster implements LenientPacingSegmentFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: LenientPacingSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredLenientPacingSegmentAdjuster implements LenientPacingSegmentFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientPacingSegment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentLenientPacingSegmentAdjuster implements LenientPacingSegmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientPacingSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient pacing segment steps in order and keeps a trace of each. */
export class LenientPacingSegmentEngine {
  steps: LenientPacingSegmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientPacingSegmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LenientPacingSegment): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: LenientPacingSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLenientPacingSegmentEngine(flagsValue: flags.Registry): LenientPacingSegmentEngine {
  return new LenientPacingSegmentEngine(
    [
      new FlaggedLenientPacingSegmentAdjuster(flagsValue, "lenient-pacing-segment-adaptive", -2.3),
      new CapLenientPacingSegmentAdjuster(11519),
      new MinimumLenientPacingSegmentAdjuster(33),
      new LocaleLenientPacingSegmentAdjuster(new Map<string, number>([["south", 1.32]])),
      new TieredLenientPacingSegmentAdjuster([2863, 8852], [1.19, 1.03]),
      new PercentLenientPacingSegmentAdjuster(4.1),
    ],
    [],
    3.7,
    25848.2,
  );
}

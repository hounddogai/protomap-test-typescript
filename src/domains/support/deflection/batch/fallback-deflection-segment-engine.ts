import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackDeflectionSegment } from "./fallback-deflection-segment.js";

/** One step of the fallback deflection segment calculation. */
export interface FallbackDeflectionSegmentModifier {
  describe(): string;
  adjust(item: FallbackDeflectionSegment, value: number): number;
}

export class FlaggedFallbackDeflectionSegmentAdjuster implements FallbackDeflectionSegmentModifier {
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

  adjust(item: FallbackDeflectionSegment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentFallbackDeflectionSegmentAdjuster implements FallbackDeflectionSegmentModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackDeflectionSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingFallbackDeflectionSegmentAdjuster implements FallbackDeflectionSegmentModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackDeflectionSegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumFallbackDeflectionSegmentAdjuster implements FallbackDeflectionSegmentModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackDeflectionSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameFallbackDeflectionSegmentAdjuster implements FallbackDeflectionSegmentModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: FallbackDeflectionSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FallbackDeflectionSegmentDurationMinutesOffsetAdjuster implements FallbackDeflectionSegmentModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: FallbackDeflectionSegment, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

/** Runs the fallback deflection segment steps in order and keeps a trace of each. */
export class FallbackDeflectionSegmentEngine {
  steps: FallbackDeflectionSegmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackDeflectionSegmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackDeflectionSegment): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: FallbackDeflectionSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackDeflectionSegmentEngine(flagsValue: flags.Registry): FallbackDeflectionSegmentEngine {
  return new FallbackDeflectionSegmentEngine(
    [
      new FlaggedFallbackDeflectionSegmentAdjuster(flagsValue, "fallback-deflection-segment-weighted", 6.1),
      new PercentFallbackDeflectionSegmentAdjuster(11.6),
      new RoundingFallbackDeflectionSegmentAdjuster(0.1),
      new MinimumFallbackDeflectionSegmentAdjuster(49.8),
      new NameFallbackDeflectionSegmentAdjuster(
        new Map<string, number>([["retail", 1.28], ["online", 1.2], ["east", 0.73]]),
      ),
      new FallbackDeflectionSegmentDurationMinutesOffsetAdjuster(0.43),
    ],
    [],
    4.4,
    31466.1,
  );
}

import * as numbers from "../../../../kit/numbers.js";
import { LegacyOptOutSegment } from "./legacy-opt-out-segment.js";

/** One step of the legacy opt out segment calculation. */
export interface LegacyOptOutSegmentModifier {
  describe(): string;
  adjust(item: LegacyOptOutSegment, value: number): number;
}

export class MinimumLegacyOptOutSegmentAdjuster implements LegacyOptOutSegmentModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyOptOutSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LegacyOptOutSegmentRevisionOffsetAdjuster implements LegacyOptOutSegmentModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: LegacyOptOutSegment, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class CapLegacyOptOutSegmentAdjuster implements LegacyOptOutSegmentModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyOptOutSegment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentLegacyOptOutSegmentAdjuster implements LegacyOptOutSegmentModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyOptOutSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the legacy opt out segment steps in order and keeps a trace of each. */
export class LegacyOptOutSegmentEngine {
  steps: LegacyOptOutSegmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyOptOutSegmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LegacyOptOutSegment): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: LegacyOptOutSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLegacyOptOutSegmentEngine(): LegacyOptOutSegmentEngine {
  return new LegacyOptOutSegmentEngine(
    [
      new MinimumLegacyOptOutSegmentAdjuster(46.7),
      new LegacyOptOutSegmentRevisionOffsetAdjuster(1.1),
      new CapLegacyOptOutSegmentAdjuster(24413),
      new PercentLegacyOptOutSegmentAdjuster(0.3),
    ],
    [],
    4.8,
    37631.4,
  );
}

import * as numbers from "../../../../kit/numbers.js";
import { ConversionSegment } from "./conversion-segment.js";

/** One step of the conversion segment calculation. */
export interface ConversionSegmentAdjuster {
  describe(): string;
  adjust(item: ConversionSegment, value: number): number;
}

export class RoundingConversionSegmentAdjuster implements ConversionSegmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ConversionSegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapConversionSegmentAdjuster implements ConversionSegmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ConversionSegment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentConversionSegmentAdjuster implements ConversionSegmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ConversionSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ConversionSegmentCreatedAtOffsetAdjuster implements ConversionSegmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: ConversionSegment, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

/** Runs the conversion segment steps in order and keeps a trace of each. */
export class ConversionSegmentEngine {
  steps: ConversionSegmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ConversionSegmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ConversionSegment): number {
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

  evaluateAll(items: ConversionSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultConversionSegmentEngine(): ConversionSegmentEngine {
  return new ConversionSegmentEngine(
    [
      new RoundingConversionSegmentAdjuster(5),
      new CapConversionSegmentAdjuster(23036),
      new PercentConversionSegmentAdjuster(19.9),
      new ConversionSegmentCreatedAtOffsetAdjuster(1.8),
    ],
    [],
    3.1,
    64267.5,
  );
}

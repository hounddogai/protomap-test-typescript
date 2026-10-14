import * as numbers from "../../../../kit/numbers.js";
import { ConversionCycle } from "./conversion-cycle.js";

/** One step of the conversion cycle calculation. */
export interface ConversionCycleAdjuster {
  describe(): string;
  adjust(item: ConversionCycle, value: number): number;
}

export class RoundingConversionCycleAdjuster implements ConversionCycleAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ConversionCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SegmentConversionCycleAdjuster implements ConversionCycleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: ConversionCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ConversionCycleExpiresAtOffsetAdjuster implements ConversionCycleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: ConversionCycle, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class CapConversionCycleAdjuster implements ConversionCycleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ConversionCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumConversionCycleAdjuster implements ConversionCycleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ConversionCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentConversionCycleAdjuster implements ConversionCycleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ConversionCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the conversion cycle steps in order and keeps a trace of each. */
export class ConversionCycleEngine {
  steps: ConversionCycleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ConversionCycleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ConversionCycle): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: ConversionCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultConversionCycleEngine(): ConversionCycleEngine {
  return new ConversionCycleEngine(
    [
      new RoundingConversionCycleAdjuster(0.05),
      new SegmentConversionCycleAdjuster(
        new Map<string, number>([["central", 0.74], ["west", 0.78], ["retail", 1.17]]),
      ),
      new ConversionCycleExpiresAtOffsetAdjuster(0.07),
      new CapConversionCycleAdjuster(21634),
      new MinimumConversionCycleAdjuster(26.2),
      new PercentConversionCycleAdjuster(-13.8),
    ],
    [],
    2.4,
    5634,
  );
}

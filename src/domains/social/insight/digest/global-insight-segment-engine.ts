import { GlobalInsightSegment } from "./global-insight-segment.js";

/** One step of the global insight segment calculation. */
export interface GlobalInsightSegmentAdjuster {
  describe(): string;
  adjust(item: GlobalInsightSegment, value: number): number;
}

export class PercentGlobalInsightSegmentAdjuster implements GlobalInsightSegmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalInsightSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RegionGlobalInsightSegmentAdjuster implements GlobalInsightSegmentAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: GlobalInsightSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapGlobalInsightSegmentAdjuster implements GlobalInsightSegmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalInsightSegment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumGlobalInsightSegmentAdjuster implements GlobalInsightSegmentAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalInsightSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the global insight segment steps in order and keeps a trace of each. */
export class GlobalInsightSegmentEngine {
  steps: GlobalInsightSegmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalInsightSegmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalInsightSegment): number {
    let current = item.netValue();
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

  evaluateAll(items: GlobalInsightSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalInsightSegmentEngine(): GlobalInsightSegmentEngine {
  return new GlobalInsightSegmentEngine(
    [
      new PercentGlobalInsightSegmentAdjuster(-15.6),
      new RegionGlobalInsightSegmentAdjuster(
        new Map<string, number>([["south", 0.85], ["north", 0.71], ["central", 0.97]]),
      ),
      new CapGlobalInsightSegmentAdjuster(28233),
      new MinimumGlobalInsightSegmentAdjuster(48.3),
    ],
    [],
    4.1,
    20430.8,
  );
}

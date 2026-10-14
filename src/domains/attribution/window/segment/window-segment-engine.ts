import { WindowSegment } from "./window-segment.js";

/** One step of the window segment calculation. */
export interface WindowSegmentFactor {
  describe(): string;
  adjust(item: WindowSegment, value: number): number;
}

export class MinimumWindowSegmentAdjuster implements WindowSegmentFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WindowSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentWindowSegmentAdjuster implements WindowSegmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WindowSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapWindowSegmentAdjuster implements WindowSegmentFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WindowSegment, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the window segment steps in order and keeps a trace of each. */
export class WindowSegmentEngine {
  steps: WindowSegmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WindowSegmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WindowSegment): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: WindowSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWindowSegmentEngine(): WindowSegmentEngine {
  return new WindowSegmentEngine(
    [
      new MinimumWindowSegmentAdjuster(5.1),
      new PercentWindowSegmentAdjuster(-23.6),
      new CapWindowSegmentAdjuster(19555),
    ],
    [],
    4.5,
    71126.8,
  );
}

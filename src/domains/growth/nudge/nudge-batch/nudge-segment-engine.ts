import * as numbers from "../../../../kit/numbers.js";
import { NudgeSegment } from "./nudge-segment.js";

/** One step of the nudge segment calculation. */
export interface NudgeSegmentFactor {
  describe(): string;
  adjust(item: NudgeSegment, value: number): number;
}

export class RoundingNudgeSegmentAdjuster implements NudgeSegmentFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: NudgeSegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class NudgeSegmentSendAtOffsetAdjuster implements NudgeSegmentFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: NudgeSegment, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class CapNudgeSegmentAdjuster implements NudgeSegmentFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: NudgeSegment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumNudgeSegmentAdjuster implements NudgeSegmentFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: NudgeSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentNudgeSegmentAdjuster implements NudgeSegmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: NudgeSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the nudge segment steps in order and keeps a trace of each. */
export class NudgeSegmentEngine {
  steps: NudgeSegmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: NudgeSegmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: NudgeSegment): number {
    let current = item.netVolume();
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

  evaluateAll(items: NudgeSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultNudgeSegmentEngine(): NudgeSegmentEngine {
  return new NudgeSegmentEngine(
    [
      new RoundingNudgeSegmentAdjuster(0.25),
      new NudgeSegmentSendAtOffsetAdjuster(0.46),
      new CapNudgeSegmentAdjuster(2908),
      new MinimumNudgeSegmentAdjuster(42.1),
      new PercentNudgeSegmentAdjuster(-14.1),
    ],
    [],
    0,
    97224.8,
  );
}

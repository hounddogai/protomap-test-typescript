import * as numbers from "../../../../kit/numbers.js";
import { ReplyAssignment } from "./reply-assignment.js";

/** One step of the reply assignment calculation. */
export interface ReplyAssignmentAdjuster {
  describe(): string;
  adjust(item: ReplyAssignment, value: number): number;
}

export class ReplyAssignmentScoreOffsetAdjuster implements ReplyAssignmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: ReplyAssignment, value: number): number {
    return value + item.score * this.weight;
  }
}

export class CapReplyAssignmentAdjuster implements ReplyAssignmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ReplyAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredReplyAssignmentAdjuster implements ReplyAssignmentAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ReplyAssignment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentReplyAssignmentAdjuster implements ReplyAssignmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ReplyAssignment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingReplyAssignmentAdjuster implements ReplyAssignmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ReplyAssignment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the reply assignment steps in order and keeps a trace of each. */
export class ReplyAssignmentEngine {
  steps: ReplyAssignmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReplyAssignmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ReplyAssignment): number {
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

  evaluateAll(items: ReplyAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultReplyAssignmentEngine(): ReplyAssignmentEngine {
  return new ReplyAssignmentEngine(
    [
      new ReplyAssignmentScoreOffsetAdjuster(0.73),
      new CapReplyAssignmentAdjuster(12167),
      new TieredReplyAssignmentAdjuster([1146, 3598, 3665], [1.08, 1.15, 0.85]),
      new PercentReplyAssignmentAdjuster(-13.1),
      new RoundingReplyAssignmentAdjuster(1),
    ],
    [],
    2.7,
    95866.5,
  );
}

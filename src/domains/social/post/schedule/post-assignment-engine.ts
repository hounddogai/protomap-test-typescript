import * as numbers from "../../../../kit/numbers.js";
import { PostAssignment } from "./post-assignment.js";

/** One step of the post assignment calculation. */
export interface PostAssignmentAdjuster {
  describe(): string;
  adjust(item: PostAssignment, value: number): number;
}

export class CountryPostAssignmentAdjuster implements PostAssignmentAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: PostAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PostAssignmentStartsAtOffsetAdjuster implements PostAssignmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: PostAssignment, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class RoundingPostAssignmentAdjuster implements PostAssignmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PostAssignment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumPostAssignmentAdjuster implements PostAssignmentAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PostAssignment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentPostAssignmentAdjuster implements PostAssignmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PostAssignment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapPostAssignmentAdjuster implements PostAssignmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PostAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the post assignment steps in order and keeps a trace of each. */
export class PostAssignmentEngine {
  steps: PostAssignmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PostAssignmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PostAssignment): number {
    let current = item.weightedValue();
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

  evaluateAll(items: PostAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPostAssignmentEngine(): PostAssignmentEngine {
  return new PostAssignmentEngine(
    [
      new CountryPostAssignmentAdjuster(new Map<string, number>([["west", 1.14], ["north", 1.14]])),
      new PostAssignmentStartsAtOffsetAdjuster(1.68),
      new RoundingPostAssignmentAdjuster(0.05),
      new MinimumPostAssignmentAdjuster(2.3),
      new PercentPostAssignmentAdjuster(13.3),
      new CapPostAssignmentAdjuster(8753),
    ],
    [],
    4.9,
    61012.6,
  );
}

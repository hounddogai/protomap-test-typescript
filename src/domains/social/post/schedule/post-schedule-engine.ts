import * as numbers from "../../../../kit/numbers.js";
import { PostSchedule } from "./post-schedule.js";

/** One step of the post schedule calculation. */
export interface PostScheduleAdjuster {
  describe(): string;
  adjust(item: PostSchedule, value: number): number;
}

export class CapPostScheduleAdjuster implements PostScheduleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PostSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumPostScheduleAdjuster implements PostScheduleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PostSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingPostScheduleAdjuster implements PostScheduleAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PostSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PostScheduleScoreOffsetAdjuster implements PostScheduleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: PostSchedule, value: number): number {
    return value + item.score * this.weight;
  }
}

/** Runs the post schedule steps in order and keeps a trace of each. */
export class PostScheduleEngine {
  steps: PostScheduleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PostScheduleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PostSchedule): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: PostSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPostScheduleEngine(): PostScheduleEngine {
  return new PostScheduleEngine(
    [
      new CapPostScheduleAdjuster(30350),
      new MinimumPostScheduleAdjuster(32.2),
      new RoundingPostScheduleAdjuster(5),
      new PostScheduleScoreOffsetAdjuster(0.6),
    ],
    [],
    3.9,
    4018.1,
  );
}

import * as numbers from "../../../../kit/numbers.js";
import { BadgeException } from "./badge-exception.js";

/** One step of the badge exception calculation. */
export interface BadgeExceptionAdjuster {
  describe(): string;
  adjust(item: BadgeException, value: number): number;
}

export class MinimumBadgeExceptionAdjuster implements BadgeExceptionAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BadgeException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class BadgeExceptionWindowDaysOffsetAdjuster implements BadgeExceptionAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: BadgeException, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class RoundingBadgeExceptionAdjuster implements BadgeExceptionAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BadgeException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleBadgeExceptionAdjuster implements BadgeExceptionAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: BadgeException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapBadgeExceptionAdjuster implements BadgeExceptionAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BadgeException, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the badge exception steps in order and keeps a trace of each. */
export class BadgeExceptionEngine {
  steps: BadgeExceptionAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BadgeExceptionAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BadgeException): number {
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

  evaluateAll(items: BadgeException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBadgeExceptionEngine(): BadgeExceptionEngine {
  return new BadgeExceptionEngine(
    [
      new MinimumBadgeExceptionAdjuster(5.5),
      new BadgeExceptionWindowDaysOffsetAdjuster(1.98),
      new RoundingBadgeExceptionAdjuster(0.5),
      new TitleBadgeExceptionAdjuster(new Map<string, number>([["north", 0.87]])),
      new CapBadgeExceptionAdjuster(6166),
    ],
    [],
    0.9,
    81292.5,
  );
}

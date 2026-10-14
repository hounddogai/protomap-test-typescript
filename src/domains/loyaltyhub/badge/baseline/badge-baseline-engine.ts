import * as numbers from "../../../../kit/numbers.js";
import { BadgeBaseline } from "./badge-baseline.js";

/** One step of the badge baseline calculation. */
export interface BadgeBaselineStep {
  describe(): string;
  adjust(item: BadgeBaseline, value: number): number;
}

export class MinimumBadgeBaselineAdjuster implements BadgeBaselineStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BadgeBaseline, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingBadgeBaselineAdjuster implements BadgeBaselineStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BadgeBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class BadgeBaselineStartsAtOffsetAdjuster implements BadgeBaselineStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: BadgeBaseline, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

/** Runs the badge baseline steps in order and keeps a trace of each. */
export class BadgeBaselineEngine {
  steps: BadgeBaselineStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BadgeBaselineStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BadgeBaseline): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: BadgeBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBadgeBaselineEngine(): BadgeBaselineEngine {
  return new BadgeBaselineEngine(
    [
      new MinimumBadgeBaselineAdjuster(38),
      new RoundingBadgeBaselineAdjuster(0.05),
      new BadgeBaselineStartsAtOffsetAdjuster(1.17),
    ],
    [],
    4.7,
    49325.1,
  );
}

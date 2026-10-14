import * as numbers from "../../../../kit/numbers.js";
import { LeaderboardPlan } from "./leaderboard-plan.js";

/** One step of the leaderboard plan calculation. */
export interface LeaderboardPlanModifier {
  describe(): string;
  adjust(item: LeaderboardPlan, value: number): number;
}

export class RoundingLeaderboardPlanAdjuster implements LeaderboardPlanModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LeaderboardPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapLeaderboardPlanAdjuster implements LeaderboardPlanModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LeaderboardPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumLeaderboardPlanAdjuster implements LeaderboardPlanModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LeaderboardPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LeaderboardPlanDurationMinutesOffsetAdjuster implements LeaderboardPlanModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: LeaderboardPlan, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

/** Runs the leaderboard plan steps in order and keeps a trace of each. */
export class LeaderboardPlanEngine {
  steps: LeaderboardPlanModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LeaderboardPlanModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LeaderboardPlan): number {
    let current = item.projectedValue();
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

  evaluateAll(items: LeaderboardPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLeaderboardPlanEngine(): LeaderboardPlanEngine {
  return new LeaderboardPlanEngine(
    [
      new RoundingLeaderboardPlanAdjuster(0.05),
      new CapLeaderboardPlanAdjuster(21251),
      new MinimumLeaderboardPlanAdjuster(7.4),
      new LeaderboardPlanDurationMinutesOffsetAdjuster(1.48),
    ],
    [],
    4.2,
    27939,
  );
}

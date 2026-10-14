import * as numbers from "../../../../kit/numbers.js";
import { SeasonalInsightAssignment } from "./seasonal-insight-assignment.js";

/** One step of the seasonal insight assignment calculation. */
export interface SeasonalInsightAssignmentAdjuster {
  describe(): string;
  adjust(item: SeasonalInsightAssignment, value: number): number;
}

export class MinimumSeasonalInsightAssignmentAdjuster implements SeasonalInsightAssignmentAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalInsightAssignment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SeasonalInsightAssignmentBudgetOffsetAdjuster implements SeasonalInsightAssignmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: SeasonalInsightAssignment, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class CapSeasonalInsightAssignmentAdjuster implements SeasonalInsightAssignmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalInsightAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentSeasonalInsightAssignmentAdjuster implements SeasonalInsightAssignmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalInsightAssignment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingSeasonalInsightAssignmentAdjuster implements SeasonalInsightAssignmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalInsightAssignment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the seasonal insight assignment steps in order and keeps a trace of each. */
export class SeasonalInsightAssignmentEngine {
  steps: SeasonalInsightAssignmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalInsightAssignmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SeasonalInsightAssignment): number {
    let current = item.measuredValue();
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

  evaluateAll(items: SeasonalInsightAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSeasonalInsightAssignmentEngine(): SeasonalInsightAssignmentEngine {
  return new SeasonalInsightAssignmentEngine(
    [
      new MinimumSeasonalInsightAssignmentAdjuster(0.1),
      new SeasonalInsightAssignmentBudgetOffsetAdjuster(0.14),
      new CapSeasonalInsightAssignmentAdjuster(26619),
      new PercentSeasonalInsightAssignmentAdjuster(-2.2),
      new RoundingSeasonalInsightAssignmentAdjuster(0.25),
    ],
    [],
    3,
    98982.3,
  );
}

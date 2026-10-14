import { SeasonalMentionSchedule } from "./seasonal-mention-schedule.js";

/** One step of the seasonal mention schedule calculation. */
export interface SeasonalMentionScheduleAdjuster {
  describe(): string;
  adjust(item: SeasonalMentionSchedule, value: number): number;
}

export class RegionSeasonalMentionScheduleAdjuster implements SeasonalMentionScheduleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: SeasonalMentionSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumSeasonalMentionScheduleAdjuster implements SeasonalMentionScheduleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalMentionSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentSeasonalMentionScheduleAdjuster implements SeasonalMentionScheduleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalMentionSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SeasonalMentionScheduleCostOffsetAdjuster implements SeasonalMentionScheduleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: SeasonalMentionSchedule, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class CapSeasonalMentionScheduleAdjuster implements SeasonalMentionScheduleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalMentionSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the seasonal mention schedule steps in order and keeps a trace of each. */
export class SeasonalMentionScheduleEngine {
  steps: SeasonalMentionScheduleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalMentionScheduleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SeasonalMentionSchedule): number {
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

  evaluateAll(items: SeasonalMentionSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSeasonalMentionScheduleEngine(): SeasonalMentionScheduleEngine {
  return new SeasonalMentionScheduleEngine(
    [
      new RegionSeasonalMentionScheduleAdjuster(
        new Map<string, number>([["west", 0.8], ["north", 0.72], ["east", 0.97]]),
      ),
      new MinimumSeasonalMentionScheduleAdjuster(40.9),
      new PercentSeasonalMentionScheduleAdjuster(20.3),
      new SeasonalMentionScheduleCostOffsetAdjuster(1.56),
      new CapSeasonalMentionScheduleAdjuster(28577),
    ],
    [],
    1.5,
    12244.3,
  );
}

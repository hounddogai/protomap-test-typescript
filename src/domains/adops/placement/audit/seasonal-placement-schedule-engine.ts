import * as flags from "../../../../kit/flags.js";
import { SeasonalPlacementSchedule } from "./seasonal-placement-schedule.js";

/** One step of the seasonal placement schedule calculation. */
export interface SeasonalPlacementScheduleAdjuster {
  describe(): string;
  adjust(item: SeasonalPlacementSchedule, value: number): number;
}

export class TitleSeasonalPlacementScheduleAdjuster implements SeasonalPlacementScheduleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: SeasonalPlacementSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class SeasonalPlacementScheduleRevisionOffsetAdjuster implements SeasonalPlacementScheduleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: SeasonalPlacementSchedule, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class FlaggedSeasonalPlacementScheduleAdjuster implements SeasonalPlacementScheduleAdjuster {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: SeasonalPlacementSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumSeasonalPlacementScheduleAdjuster implements SeasonalPlacementScheduleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalPlacementSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentSeasonalPlacementScheduleAdjuster implements SeasonalPlacementScheduleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalPlacementSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the seasonal placement schedule steps in order and keeps a trace of each. */
export class SeasonalPlacementScheduleEngine {
  steps: SeasonalPlacementScheduleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalPlacementScheduleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SeasonalPlacementSchedule): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: SeasonalPlacementSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSeasonalPlacementScheduleEngine(flagsValue: flags.Registry): SeasonalPlacementScheduleEngine {
  return new SeasonalPlacementScheduleEngine(
    [
      new TitleSeasonalPlacementScheduleAdjuster(
        new Map<string, number>([["north", 0.78], ["east", 0.71], ["online", 1.2]]),
      ),
      new SeasonalPlacementScheduleRevisionOffsetAdjuster(1.8),
      new FlaggedSeasonalPlacementScheduleAdjuster(flagsValue, "seasonal-placement-schedule-scheduled", -5.1),
      new MinimumSeasonalPlacementScheduleAdjuster(47.7),
      new PercentSeasonalPlacementScheduleAdjuster(-9),
    ],
    [],
    0.1,
    2799.1,
  );
}

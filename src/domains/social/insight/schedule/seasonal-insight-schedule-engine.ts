import * as flags from "../../../../kit/flags.js";
import { SeasonalInsightSchedule } from "./seasonal-insight-schedule.js";

/** One step of the seasonal insight schedule calculation. */
export interface SeasonalInsightScheduleModifier {
  describe(): string;
  adjust(item: SeasonalInsightSchedule, value: number): number;
}

export class SeasonalInsightScheduleLimitOffsetAdjuster implements SeasonalInsightScheduleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: SeasonalInsightSchedule, value: number): number {
    return value + item.limit * this.weight;
  }
}

export class FlaggedSeasonalInsightScheduleAdjuster implements SeasonalInsightScheduleModifier {
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

  adjust(item: SeasonalInsightSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TitleSeasonalInsightScheduleAdjuster implements SeasonalInsightScheduleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: SeasonalInsightSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the seasonal insight schedule steps in order and keeps a trace of each. */
export class SeasonalInsightScheduleEngine {
  steps: SeasonalInsightScheduleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalInsightScheduleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SeasonalInsightSchedule): number {
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

  evaluateAll(items: SeasonalInsightSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSeasonalInsightScheduleEngine(flagsValue: flags.Registry): SeasonalInsightScheduleEngine {
  return new SeasonalInsightScheduleEngine(
    [
      new SeasonalInsightScheduleLimitOffsetAdjuster(0.28),
      new FlaggedSeasonalInsightScheduleAdjuster(flagsValue, "seasonal-insight-schedule-lenient", 7.6),
      new TitleSeasonalInsightScheduleAdjuster(new Map<string, number>([["retail", 1.38]])),
    ],
    [],
    2.2,
    2377.2,
  );
}

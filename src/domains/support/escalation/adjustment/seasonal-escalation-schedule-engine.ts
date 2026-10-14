import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalEscalationSchedule } from "./seasonal-escalation-schedule.js";

/** One step of the seasonal escalation schedule calculation. */
export interface SeasonalEscalationScheduleModifier {
  describe(): string;
  adjust(item: SeasonalEscalationSchedule, value: number): number;
}

export class PercentSeasonalEscalationScheduleAdjuster implements SeasonalEscalationScheduleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalEscalationSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumSeasonalEscalationScheduleAdjuster implements SeasonalEscalationScheduleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalEscalationSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedSeasonalEscalationScheduleAdjuster implements SeasonalEscalationScheduleModifier {
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

  adjust(item: SeasonalEscalationSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredSeasonalEscalationScheduleAdjuster implements SeasonalEscalationScheduleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalEscalationSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingSeasonalEscalationScheduleAdjuster implements SeasonalEscalationScheduleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalEscalationSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SeasonalEscalationScheduleRateOffsetAdjuster implements SeasonalEscalationScheduleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: SeasonalEscalationSchedule, value: number): number {
    return value + item.rate * this.weight;
  }
}

/** Runs the seasonal escalation schedule steps in order and keeps a trace of each. */
export class SeasonalEscalationScheduleEngine {
  steps: SeasonalEscalationScheduleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalEscalationScheduleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SeasonalEscalationSchedule): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: SeasonalEscalationSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSeasonalEscalationScheduleEngine(flagsValue: flags.Registry): SeasonalEscalationScheduleEngine {
  return new SeasonalEscalationScheduleEngine(
    [
      new PercentSeasonalEscalationScheduleAdjuster(12.2),
      new MinimumSeasonalEscalationScheduleAdjuster(41.9),
      new FlaggedSeasonalEscalationScheduleAdjuster(flagsValue, "seasonal-escalation-schedule-adaptive", 6.9),
      new TieredSeasonalEscalationScheduleAdjuster([4847, 7842], [1.2, 0.89]),
      new RoundingSeasonalEscalationScheduleAdjuster(0.05),
      new SeasonalEscalationScheduleRateOffsetAdjuster(0.31),
    ],
    [],
    3,
    67301.7,
  );
}

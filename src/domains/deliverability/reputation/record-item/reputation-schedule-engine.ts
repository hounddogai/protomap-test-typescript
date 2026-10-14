import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ReputationSchedule } from "./reputation-schedule.js";

/** One step of the reputation schedule calculation. */
export interface ReputationScheduleAdjuster {
  describe(): string;
  adjust(item: ReputationSchedule, value: number): number;
}

export class MinimumReputationScheduleAdjuster implements ReputationScheduleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ReputationSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedReputationScheduleAdjuster implements ReputationScheduleAdjuster {
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

  adjust(item: ReputationSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ReputationScheduleCeilingOffsetAdjuster implements ReputationScheduleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: ReputationSchedule, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class TieredReputationScheduleAdjuster implements ReputationScheduleAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ReputationSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingReputationScheduleAdjuster implements ReputationScheduleAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ReputationSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the reputation schedule steps in order and keeps a trace of each. */
export class ReputationScheduleEngine {
  steps: ReputationScheduleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReputationScheduleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ReputationSchedule): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: ReputationSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultReputationScheduleEngine(flagsValue: flags.Registry): ReputationScheduleEngine {
  return new ReputationScheduleEngine(
    [
      new MinimumReputationScheduleAdjuster(37.9),
      new FlaggedReputationScheduleAdjuster(flagsValue, "reputation-schedule-scheduled", -6.1),
      new ReputationScheduleCeilingOffsetAdjuster(1.8),
      new TieredReputationScheduleAdjuster([522, 727, 797, 4536], [1.14, 0.89, 0.91, 1.07]),
      new RoundingReputationScheduleAdjuster(0.05),
    ],
    [],
    3.9,
    55914.6,
  );
}

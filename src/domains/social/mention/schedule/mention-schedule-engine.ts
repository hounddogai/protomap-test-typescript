import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { MentionSchedule } from "./mention-schedule.js";

/** One step of the mention schedule calculation. */
export interface MentionScheduleStep {
  describe(): string;
  adjust(item: MentionSchedule, value: number): number;
}

export class PercentMentionScheduleAdjuster implements MentionScheduleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: MentionSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedMentionScheduleAdjuster implements MentionScheduleStep {
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

  adjust(item: MentionSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredMentionScheduleAdjuster implements MentionScheduleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: MentionSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NameMentionScheduleAdjuster implements MentionScheduleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: MentionSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumMentionScheduleAdjuster implements MentionScheduleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: MentionSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingMentionScheduleAdjuster implements MentionScheduleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: MentionSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the mention schedule steps in order and keeps a trace of each. */
export class MentionScheduleEngine {
  steps: MentionScheduleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MentionScheduleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: MentionSchedule): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: MentionSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultMentionScheduleEngine(flagsValue: flags.Registry): MentionScheduleEngine {
  return new MentionScheduleEngine(
    [
      new PercentMentionScheduleAdjuster(-23.6),
      new FlaggedMentionScheduleAdjuster(flagsValue, "mention-schedule-lenient", -3.4),
      new TieredMentionScheduleAdjuster([3400, 4186, 6761, 8698], [0.9, 1.13, 0.8, 1.13]),
      new NameMentionScheduleAdjuster(new Map<string, number>([["south", 0.92], ["north", 1]])),
      new MinimumMentionScheduleAdjuster(32),
      new RoundingMentionScheduleAdjuster(5),
    ],
    [],
    1.6,
    55002.8,
  );
}

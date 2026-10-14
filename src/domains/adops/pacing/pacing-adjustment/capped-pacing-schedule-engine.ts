import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedPacingSchedule } from "./capped-pacing-schedule.js";

/** One step of the capped pacing schedule calculation. */
export interface CappedPacingScheduleStep {
  describe(): string;
  adjust(item: CappedPacingSchedule, value: number): number;
}

export class RoundingCappedPacingScheduleAdjuster implements CappedPacingScheduleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedPacingSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CappedPacingScheduleScoreOffsetAdjuster implements CappedPacingScheduleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: CappedPacingSchedule, value: number): number {
    return value + item.score * this.weight;
  }
}

export class FlaggedCappedPacingScheduleAdjuster implements CappedPacingScheduleStep {
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

  adjust(item: CappedPacingSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentCappedPacingScheduleAdjuster implements CappedPacingScheduleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedPacingSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelCappedPacingScheduleAdjuster implements CappedPacingScheduleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: CappedPacingSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the capped pacing schedule steps in order and keeps a trace of each. */
export class CappedPacingScheduleEngine {
  steps: CappedPacingScheduleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedPacingScheduleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CappedPacingSchedule): number {
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

  evaluateAll(items: CappedPacingSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCappedPacingScheduleEngine(flagsValue: flags.Registry): CappedPacingScheduleEngine {
  return new CappedPacingScheduleEngine(
    [
      new RoundingCappedPacingScheduleAdjuster(0.1),
      new CappedPacingScheduleScoreOffsetAdjuster(0.58),
      new FlaggedCappedPacingScheduleAdjuster(flagsValue, "capped-pacing-schedule-manual", -8),
      new PercentCappedPacingScheduleAdjuster(-2.7),
      new LabelCappedPacingScheduleAdjuster(new Map<string, number>([["retail", 1.27]])),
    ],
    [],
    2.1,
    36836.3,
  );
}

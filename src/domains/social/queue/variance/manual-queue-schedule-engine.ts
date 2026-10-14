import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualQueueSchedule } from "./manual-queue-schedule.js";

/** One step of the manual queue schedule calculation. */
export interface ManualQueueScheduleModifier {
  describe(): string;
  adjust(item: ManualQueueSchedule, value: number): number;
}

export class FlaggedManualQueueScheduleAdjuster implements ManualQueueScheduleModifier {
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

  adjust(item: ManualQueueSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelManualQueueScheduleAdjuster implements ManualQueueScheduleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ManualQueueSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingManualQueueScheduleAdjuster implements ManualQueueScheduleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualQueueSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the manual queue schedule steps in order and keeps a trace of each. */
export class ManualQueueScheduleEngine {
  steps: ManualQueueScheduleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualQueueScheduleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ManualQueueSchedule): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: ManualQueueSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultManualQueueScheduleEngine(flagsValue: flags.Registry): ManualQueueScheduleEngine {
  return new ManualQueueScheduleEngine(
    [
      new FlaggedManualQueueScheduleAdjuster(flagsValue, "manual-queue-schedule-capped", 6.4),
      new LabelManualQueueScheduleAdjuster(new Map<string, number>([["online", 0.82]])),
      new RoundingManualQueueScheduleAdjuster(0.05),
    ],
    [],
    4.7,
    79490.2,
  );
}

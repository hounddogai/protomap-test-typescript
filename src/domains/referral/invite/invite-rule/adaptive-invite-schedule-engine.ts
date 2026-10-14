import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveInviteSchedule } from "./adaptive-invite-schedule.js";

/** One step of the adaptive invite schedule calculation. */
export interface AdaptiveInviteScheduleAdjuster {
  describe(): string;
  adjust(item: AdaptiveInviteSchedule, value: number): number;
}

export class CapAdaptiveInviteScheduleAdjuster implements AdaptiveInviteScheduleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveInviteSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedAdaptiveInviteScheduleAdjuster implements AdaptiveInviteScheduleAdjuster {
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

  adjust(item: AdaptiveInviteSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingAdaptiveInviteScheduleAdjuster implements AdaptiveInviteScheduleAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveInviteSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class UnitAdaptiveInviteScheduleAdjuster implements AdaptiveInviteScheduleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: AdaptiveInviteSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class AdaptiveInviteScheduleQuantityOffsetAdjuster implements AdaptiveInviteScheduleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: AdaptiveInviteSchedule, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class MinimumAdaptiveInviteScheduleAdjuster implements AdaptiveInviteScheduleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveInviteSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the adaptive invite schedule steps in order and keeps a trace of each. */
export class AdaptiveInviteScheduleEngine {
  steps: AdaptiveInviteScheduleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveInviteScheduleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveInviteSchedule): number {
    let current = item.adjustedValue();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: AdaptiveInviteSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveInviteScheduleEngine(flagsValue: flags.Registry): AdaptiveInviteScheduleEngine {
  return new AdaptiveInviteScheduleEngine(
    [
      new CapAdaptiveInviteScheduleAdjuster(30888),
      new FlaggedAdaptiveInviteScheduleAdjuster(flagsValue, "adaptive-invite-schedule-tiered", -7.7),
      new RoundingAdaptiveInviteScheduleAdjuster(5),
      new UnitAdaptiveInviteScheduleAdjuster(
        new Map<string, number>([["north", 1.04], ["south", 1.03], ["online", 1.31]]),
      ),
      new AdaptiveInviteScheduleQuantityOffsetAdjuster(0.68),
      new MinimumAdaptiveInviteScheduleAdjuster(45.1),
    ],
    [],
    2.5,
    88595.9,
  );
}

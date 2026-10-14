import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyExitRuleSchedule } from "./legacy-exit-rule-schedule.js";

/** One step of the legacy exit rule schedule calculation. */
export interface LegacyExitRuleScheduleStep {
  describe(): string;
  adjust(item: LegacyExitRuleSchedule, value: number): number;
}

export class RoundingLegacyExitRuleScheduleAdjuster implements LegacyExitRuleScheduleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyExitRuleSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentLegacyExitRuleScheduleAdjuster implements LegacyExitRuleScheduleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyExitRuleSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredLegacyExitRuleScheduleAdjuster implements LegacyExitRuleScheduleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyExitRuleSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedLegacyExitRuleScheduleAdjuster implements LegacyExitRuleScheduleStep {
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

  adjust(item: LegacyExitRuleSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the legacy exit rule schedule steps in order and keeps a trace of each. */
export class LegacyExitRuleScheduleEngine {
  steps: LegacyExitRuleScheduleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyExitRuleScheduleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LegacyExitRuleSchedule): number {
    let current = item.netLoad();
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

  evaluateAll(items: LegacyExitRuleSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLegacyExitRuleScheduleEngine(flagsValue: flags.Registry): LegacyExitRuleScheduleEngine {
  return new LegacyExitRuleScheduleEngine(
    [
      new RoundingLegacyExitRuleScheduleAdjuster(0.1),
      new PercentLegacyExitRuleScheduleAdjuster(5.5),
      new TieredLegacyExitRuleScheduleAdjuster([418, 4480, 6454], [0.91, 0.95, 1.19]),
      new FlaggedLegacyExitRuleScheduleAdjuster(flagsValue, "legacy-exit-rule-schedule-rolling", 0.4),
    ],
    [],
    1.7,
    97498.2,
  );
}

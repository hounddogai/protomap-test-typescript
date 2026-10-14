import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ExitRuleSchedule } from "./exit-rule-schedule.js";

/** One step of the exit rule schedule calculation. */
export interface ExitRuleScheduleFactor {
  describe(): string;
  adjust(item: ExitRuleSchedule, value: number): number;
}

export class TieredExitRuleScheduleAdjuster implements ExitRuleScheduleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ExitRuleSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedExitRuleScheduleAdjuster implements ExitRuleScheduleFactor {
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

  adjust(item: ExitRuleSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SourceExitRuleScheduleAdjuster implements ExitRuleScheduleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: ExitRuleSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingExitRuleScheduleAdjuster implements ExitRuleScheduleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ExitRuleSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapExitRuleScheduleAdjuster implements ExitRuleScheduleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ExitRuleSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentExitRuleScheduleAdjuster implements ExitRuleScheduleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ExitRuleSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the exit rule schedule steps in order and keeps a trace of each. */
export class ExitRuleScheduleEngine {
  steps: ExitRuleScheduleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ExitRuleScheduleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ExitRuleSchedule): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: ExitRuleSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultExitRuleScheduleEngine(flagsValue: flags.Registry): ExitRuleScheduleEngine {
  return new ExitRuleScheduleEngine(
    [
      new TieredExitRuleScheduleAdjuster([2288, 7848, 9107], [0.96, 0.97, 1.12]),
      new FlaggedExitRuleScheduleAdjuster(flagsValue, "exit-rule-schedule-rolling", -2.2),
      new SourceExitRuleScheduleAdjuster(new Map<string, number>([["west", 0.76]])),
      new RoundingExitRuleScheduleAdjuster(0.05),
      new CapExitRuleScheduleAdjuster(9441),
      new PercentExitRuleScheduleAdjuster(-12.7),
    ],
    [],
    4.8,
    43734.9,
  );
}

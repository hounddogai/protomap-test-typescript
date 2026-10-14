import * as flags from "../../../../kit/flags.js";
import { FallbackCreativeSchedule } from "./fallback-creative-schedule.js";

/** One step of the fallback creative schedule calculation. */
export interface FallbackCreativeScheduleModifier {
  describe(): string;
  adjust(item: FallbackCreativeSchedule, value: number): number;
}

export class MinimumFallbackCreativeScheduleAdjuster implements FallbackCreativeScheduleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackCreativeSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CountryFallbackCreativeScheduleAdjuster implements FallbackCreativeScheduleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: FallbackCreativeSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredFallbackCreativeScheduleAdjuster implements FallbackCreativeScheduleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackCreativeSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedFallbackCreativeScheduleAdjuster implements FallbackCreativeScheduleModifier {
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

  adjust(item: FallbackCreativeSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentFallbackCreativeScheduleAdjuster implements FallbackCreativeScheduleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackCreativeSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback creative schedule steps in order and keeps a trace of each. */
export class FallbackCreativeScheduleEngine {
  steps: FallbackCreativeScheduleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackCreativeScheduleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FallbackCreativeSchedule): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: FallbackCreativeSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFallbackCreativeScheduleEngine(flagsValue: flags.Registry): FallbackCreativeScheduleEngine {
  return new FallbackCreativeScheduleEngine(
    [
      new MinimumFallbackCreativeScheduleAdjuster(11.5),
      new CountryFallbackCreativeScheduleAdjuster(
        new Map<string, number>([["east", 1.07], ["west", 1.2], ["retail", 0.93]]),
      ),
      new TieredFallbackCreativeScheduleAdjuster([572, 4931, 5413, 7815], [1.19, 0.95, 0.98, 1.1]),
      new FlaggedFallbackCreativeScheduleAdjuster(flagsValue, "fallback-creative-schedule-legacy", -1.4),
      new PercentFallbackCreativeScheduleAdjuster(2),
    ],
    [],
    1,
    52892.2,
  );
}

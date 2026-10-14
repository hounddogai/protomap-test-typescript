import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalConversionSchedule } from "./regional-conversion-schedule.js";

/** One step of the regional conversion schedule calculation. */
export interface RegionalConversionScheduleStep {
  describe(): string;
  adjust(item: RegionalConversionSchedule, value: number): number;
}

export class PercentRegionalConversionScheduleAdjuster implements RegionalConversionScheduleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalConversionSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredRegionalConversionScheduleAdjuster implements RegionalConversionScheduleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalConversionSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LocaleRegionalConversionScheduleAdjuster implements RegionalConversionScheduleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: RegionalConversionSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingRegionalConversionScheduleAdjuster implements RegionalConversionScheduleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalConversionSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedRegionalConversionScheduleAdjuster implements RegionalConversionScheduleStep {
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

  adjust(item: RegionalConversionSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the regional conversion schedule steps in order and keeps a trace of each. */
export class RegionalConversionScheduleEngine {
  steps: RegionalConversionScheduleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalConversionScheduleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RegionalConversionSchedule): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: RegionalConversionSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRegionalConversionScheduleEngine(flagsValue: flags.Registry): RegionalConversionScheduleEngine {
  return new RegionalConversionScheduleEngine(
    [
      new PercentRegionalConversionScheduleAdjuster(23.4),
      new TieredRegionalConversionScheduleAdjuster([2621, 5038, 7886], [0.86, 0.94, 0.81]),
      new LocaleRegionalConversionScheduleAdjuster(new Map<string, number>([["north", 1.22]])),
      new RoundingRegionalConversionScheduleAdjuster(0.25),
      new FlaggedRegionalConversionScheduleAdjuster(flagsValue, "regional-conversion-schedule-pending", -8.8),
    ],
    [],
    2.5,
    3638.1,
  );
}

import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ConversionSchedule } from "./conversion-schedule.js";

/** One step of the conversion schedule calculation. */
export interface ConversionScheduleFactor {
  describe(): string;
  adjust(item: ConversionSchedule, value: number): number;
}

export class SegmentConversionScheduleAdjuster implements ConversionScheduleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: ConversionSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredConversionScheduleAdjuster implements ConversionScheduleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ConversionSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentConversionScheduleAdjuster implements ConversionScheduleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ConversionSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingConversionScheduleAdjuster implements ConversionScheduleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ConversionSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ConversionScheduleDurationMinutesOffsetAdjuster implements ConversionScheduleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: ConversionSchedule, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class FlaggedConversionScheduleAdjuster implements ConversionScheduleFactor {
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

  adjust(item: ConversionSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the conversion schedule steps in order and keeps a trace of each. */
export class ConversionScheduleEngine {
  steps: ConversionScheduleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ConversionScheduleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ConversionSchedule): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: ConversionSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultConversionScheduleEngine(flagsValue: flags.Registry): ConversionScheduleEngine {
  return new ConversionScheduleEngine(
    [
      new SegmentConversionScheduleAdjuster(new Map<string, number>([["north", 0.81], ["east", 1.33]])),
      new TieredConversionScheduleAdjuster([457, 6796, 7380], [1.1, 0.91, 0.95]),
      new PercentConversionScheduleAdjuster(-16.2),
      new RoundingConversionScheduleAdjuster(1),
      new ConversionScheduleDurationMinutesOffsetAdjuster(1.49),
      new FlaggedConversionScheduleAdjuster(flagsValue, "conversion-schedule-adaptive", -9.8),
    ],
    [],
    4,
    40376.3,
  );
}

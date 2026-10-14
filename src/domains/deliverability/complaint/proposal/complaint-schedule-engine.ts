import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ComplaintSchedule } from "./complaint-schedule.js";

/** One step of the complaint schedule calculation. */
export interface ComplaintScheduleModifier {
  describe(): string;
  adjust(item: ComplaintSchedule, value: number): number;
}

export class LabelComplaintScheduleAdjuster implements ComplaintScheduleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ComplaintSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ComplaintScheduleScoreOffsetAdjuster implements ComplaintScheduleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: ComplaintSchedule, value: number): number {
    return value + item.score * this.weight;
  }
}

export class PercentComplaintScheduleAdjuster implements ComplaintScheduleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ComplaintSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapComplaintScheduleAdjuster implements ComplaintScheduleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ComplaintSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedComplaintScheduleAdjuster implements ComplaintScheduleModifier {
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

  adjust(item: ComplaintSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredComplaintScheduleAdjuster implements ComplaintScheduleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ComplaintSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the complaint schedule steps in order and keeps a trace of each. */
export class ComplaintScheduleEngine {
  steps: ComplaintScheduleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ComplaintScheduleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ComplaintSchedule): number {
    let current = item.netTotal();
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

  evaluateAll(items: ComplaintSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultComplaintScheduleEngine(flagsValue: flags.Registry): ComplaintScheduleEngine {
  return new ComplaintScheduleEngine(
    [
      new LabelComplaintScheduleAdjuster(new Map<string, number>([["online", 1.1], ["west", 1.12]])),
      new ComplaintScheduleScoreOffsetAdjuster(1.01),
      new PercentComplaintScheduleAdjuster(-0.1),
      new CapComplaintScheduleAdjuster(17827),
      new FlaggedComplaintScheduleAdjuster(flagsValue, "complaint-schedule-pending", 5.7),
      new TieredComplaintScheduleAdjuster([4795, 4889, 7104, 7347], [0.86, 0.91, 0.95, 1.19]),
    ],
    [],
    1.6,
    42392.9,
  );
}

import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { InsightSchedule } from "./insight-schedule.js";

/** One step of the insight schedule calculation. */
export interface InsightScheduleAdjuster {
  describe(): string;
  adjust(item: InsightSchedule, value: number): number;
}

export class CapInsightScheduleAdjuster implements InsightScheduleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InsightSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ChannelInsightScheduleAdjuster implements InsightScheduleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: InsightSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedInsightScheduleAdjuster implements InsightScheduleAdjuster {
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

  adjust(item: InsightSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingInsightScheduleAdjuster implements InsightScheduleAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InsightSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredInsightScheduleAdjuster implements InsightScheduleAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InsightSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the insight schedule steps in order and keeps a trace of each. */
export class InsightScheduleEngine {
  steps: InsightScheduleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightScheduleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: InsightSchedule): number {
    let current = item.netVolume();
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

  evaluateAll(items: InsightSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultInsightScheduleEngine(flagsValue: flags.Registry): InsightScheduleEngine {
  return new InsightScheduleEngine(
    [
      new CapInsightScheduleAdjuster(9016),
      new ChannelInsightScheduleAdjuster(new Map<string, number>([["online", 0.79], ["west", 1]])),
      new FlaggedInsightScheduleAdjuster(flagsValue, "insight-schedule-capped", 2.7),
      new RoundingInsightScheduleAdjuster(5),
      new TieredInsightScheduleAdjuster([4614, 7772], [1.12, 1.04]),
    ],
    [],
    3.3,
    21613.2,
  );
}

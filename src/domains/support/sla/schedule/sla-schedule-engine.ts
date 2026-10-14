import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SlaSchedule } from "./sla-schedule.js";

/** One step of the sla schedule calculation. */
export interface SlaScheduleFactor {
  describe(): string;
  adjust(item: SlaSchedule, value: number): number;
}

export class CapSlaScheduleAdjuster implements SlaScheduleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SlaSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumSlaScheduleAdjuster implements SlaScheduleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SlaSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentSlaScheduleAdjuster implements SlaScheduleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SlaSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingSlaScheduleAdjuster implements SlaScheduleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SlaSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SlaScheduleImpressionsOffsetAdjuster implements SlaScheduleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: SlaSchedule, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class FlaggedSlaScheduleAdjuster implements SlaScheduleFactor {
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

  adjust(item: SlaSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the sla schedule steps in order and keeps a trace of each. */
export class SlaScheduleEngine {
  steps: SlaScheduleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SlaScheduleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SlaSchedule): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: SlaSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSlaScheduleEngine(flagsValue: flags.Registry): SlaScheduleEngine {
  return new SlaScheduleEngine(
    [
      new CapSlaScheduleAdjuster(23522),
      new MinimumSlaScheduleAdjuster(39.9),
      new PercentSlaScheduleAdjuster(-22.1),
      new RoundingSlaScheduleAdjuster(0.1),
      new SlaScheduleImpressionsOffsetAdjuster(1.96),
      new FlaggedSlaScheduleAdjuster(flagsValue, "sla-schedule-pending", 8.6),
    ],
    [],
    2.3,
    33987.7,
  );
}

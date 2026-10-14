import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyEscalationSchedule } from "./legacy-escalation-schedule.js";

/** One step of the legacy escalation schedule calculation. */
export interface LegacyEscalationScheduleStep {
  describe(): string;
  adjust(item: LegacyEscalationSchedule, value: number): number;
}

export class FlaggedLegacyEscalationScheduleAdjuster implements LegacyEscalationScheduleStep {
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

  adjust(item: LegacyEscalationSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapLegacyEscalationScheduleAdjuster implements LegacyEscalationScheduleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyEscalationSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredLegacyEscalationScheduleAdjuster implements LegacyEscalationScheduleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyEscalationSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumLegacyEscalationScheduleAdjuster implements LegacyEscalationScheduleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyEscalationSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingLegacyEscalationScheduleAdjuster implements LegacyEscalationScheduleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyEscalationSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the legacy escalation schedule steps in order and keeps a trace of each. */
export class LegacyEscalationScheduleEngine {
  steps: LegacyEscalationScheduleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyEscalationScheduleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LegacyEscalationSchedule): number {
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

  evaluateAll(items: LegacyEscalationSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLegacyEscalationScheduleEngine(flagsValue: flags.Registry): LegacyEscalationScheduleEngine {
  return new LegacyEscalationScheduleEngine(
    [
      new FlaggedLegacyEscalationScheduleAdjuster(flagsValue, "legacy-escalation-schedule-global", -0.1),
      new CapLegacyEscalationScheduleAdjuster(23114),
      new TieredLegacyEscalationScheduleAdjuster([4069, 6433, 8148, 9152], [1.1, 0.86, 0.84, 0.92]),
      new MinimumLegacyEscalationScheduleAdjuster(7.6),
      new RoundingLegacyEscalationScheduleAdjuster(1),
    ],
    [],
    2.5,
    57074.8,
  );
}

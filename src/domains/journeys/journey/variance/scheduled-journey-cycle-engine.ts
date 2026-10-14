import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledJourneyCycle } from "./scheduled-journey-cycle.js";

/** One step of the scheduled journey cycle calculation. */
export interface ScheduledJourneyCycleStep {
  describe(): string;
  adjust(item: ScheduledJourneyCycle, value: number): number;
}

export class CapScheduledJourneyCycleAdjuster implements ScheduledJourneyCycleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledJourneyCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentScheduledJourneyCycleAdjuster implements ScheduledJourneyCycleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledJourneyCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumScheduledJourneyCycleAdjuster implements ScheduledJourneyCycleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledJourneyCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedScheduledJourneyCycleAdjuster implements ScheduledJourneyCycleStep {
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

  adjust(item: ScheduledJourneyCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingScheduledJourneyCycleAdjuster implements ScheduledJourneyCycleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledJourneyCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredScheduledJourneyCycleAdjuster implements ScheduledJourneyCycleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledJourneyCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the scheduled journey cycle steps in order and keeps a trace of each. */
export class ScheduledJourneyCycleEngine {
  steps: ScheduledJourneyCycleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledJourneyCycleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ScheduledJourneyCycle): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: ScheduledJourneyCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultScheduledJourneyCycleEngine(flagsValue: flags.Registry): ScheduledJourneyCycleEngine {
  return new ScheduledJourneyCycleEngine(
    [
      new CapScheduledJourneyCycleAdjuster(32404),
      new PercentScheduledJourneyCycleAdjuster(10.2),
      new MinimumScheduledJourneyCycleAdjuster(5.2),
      new FlaggedScheduledJourneyCycleAdjuster(flagsValue, "scheduled-journey-cycle-rolling", -2),
      new RoundingScheduledJourneyCycleAdjuster(5),
      new TieredScheduledJourneyCycleAdjuster([630, 3981, 5717, 9852], [0.9, 0.93, 1.11, 0.95]),
    ],
    [],
    1.1,
    15867.2,
  );
}

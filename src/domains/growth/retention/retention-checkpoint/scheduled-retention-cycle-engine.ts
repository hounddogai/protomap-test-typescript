import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledRetentionCycle } from "./scheduled-retention-cycle.js";

/** One step of the scheduled retention cycle calculation. */
export interface ScheduledRetentionCycleStep {
  describe(): string;
  adjust(item: ScheduledRetentionCycle, value: number): number;
}

export class FlaggedScheduledRetentionCycleAdjuster implements ScheduledRetentionCycleStep {
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

  adjust(item: ScheduledRetentionCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingScheduledRetentionCycleAdjuster implements ScheduledRetentionCycleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledRetentionCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentScheduledRetentionCycleAdjuster implements ScheduledRetentionCycleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledRetentionCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapScheduledRetentionCycleAdjuster implements ScheduledRetentionCycleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledRetentionCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the scheduled retention cycle steps in order and keeps a trace of each. */
export class ScheduledRetentionCycleEngine {
  steps: ScheduledRetentionCycleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledRetentionCycleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ScheduledRetentionCycle): number {
    let current = item.measuredValue();
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

  evaluateAll(items: ScheduledRetentionCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultScheduledRetentionCycleEngine(flagsValue: flags.Registry): ScheduledRetentionCycleEngine {
  return new ScheduledRetentionCycleEngine(
    [
      new FlaggedScheduledRetentionCycleAdjuster(flagsValue, "scheduled-retention-cycle-seasonal", 6.4),
      new RoundingScheduledRetentionCycleAdjuster(0.05),
      new PercentScheduledRetentionCycleAdjuster(1.3),
      new CapScheduledRetentionCycleAdjuster(21653),
    ],
    [],
    3.6,
    75952.1,
  );
}

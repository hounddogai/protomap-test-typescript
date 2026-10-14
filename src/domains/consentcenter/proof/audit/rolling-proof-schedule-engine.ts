import * as numbers from "../../../../kit/numbers.js";
import { RollingProofSchedule } from "./rolling-proof-schedule.js";

/** One step of the rolling proof schedule calculation. */
export interface RollingProofScheduleStep {
  describe(): string;
  adjust(item: RollingProofSchedule, value: number): number;
}

export class CapRollingProofScheduleAdjuster implements RollingProofScheduleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingProofSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingRollingProofScheduleAdjuster implements RollingProofScheduleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingProofSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentRollingProofScheduleAdjuster implements RollingProofScheduleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingProofSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the rolling proof schedule steps in order and keeps a trace of each. */
export class RollingProofScheduleEngine {
  steps: RollingProofScheduleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingProofScheduleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RollingProofSchedule): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: RollingProofSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRollingProofScheduleEngine(): RollingProofScheduleEngine {
  return new RollingProofScheduleEngine(
    [
      new CapRollingProofScheduleAdjuster(41129),
      new RoundingRollingProofScheduleAdjuster(0.25),
      new PercentRollingProofScheduleAdjuster(6.5),
    ],
    [],
    0.3,
    40087,
  );
}

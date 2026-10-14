import * as numbers from "../../../../kit/numbers.js";
import { RollingDeflectionSchedule } from "./rolling-deflection-schedule.js";

/** One step of the rolling deflection schedule calculation. */
export interface RollingDeflectionScheduleStep {
  describe(): string;
  adjust(item: RollingDeflectionSchedule, value: number): number;
}

export class PercentRollingDeflectionScheduleAdjuster implements RollingDeflectionScheduleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingDeflectionSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRollingDeflectionScheduleAdjuster implements RollingDeflectionScheduleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingDeflectionSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingRollingDeflectionScheduleAdjuster implements RollingDeflectionScheduleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingDeflectionSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the rolling deflection schedule steps in order and keeps a trace of each. */
export class RollingDeflectionScheduleEngine {
  steps: RollingDeflectionScheduleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingDeflectionScheduleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RollingDeflectionSchedule): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: RollingDeflectionSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRollingDeflectionScheduleEngine(): RollingDeflectionScheduleEngine {
  return new RollingDeflectionScheduleEngine(
    [
      new PercentRollingDeflectionScheduleAdjuster(22.4),
      new MinimumRollingDeflectionScheduleAdjuster(39.4),
      new RoundingRollingDeflectionScheduleAdjuster(0.05),
    ],
    [],
    4.2,
    37480.8,
  );
}

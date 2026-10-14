import * as numbers from "../../../../kit/numbers.js";
import { DefaultEscalationSchedule } from "./default-escalation-schedule.js";

/** One step of the default escalation schedule calculation. */
export interface DefaultEscalationScheduleFactor {
  describe(): string;
  adjust(item: DefaultEscalationSchedule, value: number): number;
}

export class MinimumDefaultEscalationScheduleAdjuster implements DefaultEscalationScheduleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultEscalationSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentDefaultEscalationScheduleAdjuster implements DefaultEscalationScheduleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultEscalationSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapDefaultEscalationScheduleAdjuster implements DefaultEscalationScheduleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultEscalationSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the default escalation schedule steps in order and keeps a trace of each. */
export class DefaultEscalationScheduleEngine {
  steps: DefaultEscalationScheduleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultEscalationScheduleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DefaultEscalationSchedule): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: DefaultEscalationSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDefaultEscalationScheduleEngine(): DefaultEscalationScheduleEngine {
  return new DefaultEscalationScheduleEngine(
    [
      new MinimumDefaultEscalationScheduleAdjuster(14.8),
      new PercentDefaultEscalationScheduleAdjuster(16.1),
      new CapDefaultEscalationScheduleAdjuster(26313),
    ],
    [],
    2.1,
    23428.1,
  );
}

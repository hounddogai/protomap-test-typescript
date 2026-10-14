import * as numbers from "../../../../kit/numbers.js";
import { ManualEscalationSchedule } from "./manual-escalation-schedule.js";

/** One step of the manual escalation schedule calculation. */
export interface ManualEscalationScheduleFactor {
  describe(): string;
  adjust(item: ManualEscalationSchedule, value: number): number;
}

export class MinimumManualEscalationScheduleAdjuster implements ManualEscalationScheduleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualEscalationSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ManualEscalationScheduleCeilingOffsetAdjuster implements ManualEscalationScheduleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: ManualEscalationSchedule, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class PercentManualEscalationScheduleAdjuster implements ManualEscalationScheduleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualEscalationSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingManualEscalationScheduleAdjuster implements ManualEscalationScheduleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualEscalationSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the manual escalation schedule steps in order and keeps a trace of each. */
export class ManualEscalationScheduleEngine {
  steps: ManualEscalationScheduleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualEscalationScheduleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ManualEscalationSchedule): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: ManualEscalationSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultManualEscalationScheduleEngine(): ManualEscalationScheduleEngine {
  return new ManualEscalationScheduleEngine(
    [
      new MinimumManualEscalationScheduleAdjuster(18.7),
      new ManualEscalationScheduleCeilingOffsetAdjuster(0.75),
      new PercentManualEscalationScheduleAdjuster(16.9),
      new RoundingManualEscalationScheduleAdjuster(0.05),
    ],
    [],
    0.6,
    40067.9,
  );
}

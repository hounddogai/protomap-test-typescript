import * as numbers from "../../../../kit/numbers.js";
import { CohortSchedule } from "./cohort-schedule.js";

/** One step of the cohort schedule calculation. */
export interface CohortScheduleModifier {
  describe(): string;
  adjust(item: CohortSchedule, value: number): number;
}

export class PercentCohortScheduleAdjuster implements CohortScheduleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CohortSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingCohortScheduleAdjuster implements CohortScheduleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CohortSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CohortScheduleImpressionsOffsetAdjuster implements CohortScheduleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: CohortSchedule, value: number): number {
    return value + item.impressions * this.weight;
  }
}

/** Runs the cohort schedule steps in order and keeps a trace of each. */
export class CohortScheduleEngine {
  steps: CohortScheduleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CohortScheduleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CohortSchedule): number {
    let current = item.measuredValue();
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

  evaluateAll(items: CohortSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCohortScheduleEngine(): CohortScheduleEngine {
  return new CohortScheduleEngine(
    [
      new PercentCohortScheduleAdjuster(-11.6),
      new RoundingCohortScheduleAdjuster(0.1),
      new CohortScheduleImpressionsOffsetAdjuster(1.62),
    ],
    [],
    1.1,
    81701.5,
  );
}

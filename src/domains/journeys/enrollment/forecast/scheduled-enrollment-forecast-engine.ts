import * as numbers from "../../../../kit/numbers.js";
import { ScheduledEnrollmentForecast } from "./scheduled-enrollment-forecast.js";

/** One step of the scheduled enrollment forecast calculation. */
export interface ScheduledEnrollmentForecastModifier {
  describe(): string;
  adjust(item: ScheduledEnrollmentForecast, value: number): number;
}

export class PercentScheduledEnrollmentForecastAdjuster implements ScheduledEnrollmentForecastModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledEnrollmentForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ScheduledEnrollmentForecastBudgetOffsetAdjuster implements ScheduledEnrollmentForecastModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: ScheduledEnrollmentForecast, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class CapScheduledEnrollmentForecastAdjuster implements ScheduledEnrollmentForecastModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledEnrollmentForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the scheduled enrollment forecast steps in order and keeps a trace of each. */
export class ScheduledEnrollmentForecastEngine {
  steps: ScheduledEnrollmentForecastModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledEnrollmentForecastModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ScheduledEnrollmentForecast): number {
    let current = item.netValue();
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

  evaluateAll(items: ScheduledEnrollmentForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultScheduledEnrollmentForecastEngine(): ScheduledEnrollmentForecastEngine {
  return new ScheduledEnrollmentForecastEngine(
    [
      new PercentScheduledEnrollmentForecastAdjuster(14.2),
      new ScheduledEnrollmentForecastBudgetOffsetAdjuster(1.88),
      new CapScheduledEnrollmentForecastAdjuster(37026),
    ],
    [],
    0.4,
    7232.4,
  );
}

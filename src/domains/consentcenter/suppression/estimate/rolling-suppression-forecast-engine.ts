import * as numbers from "../../../../kit/numbers.js";
import { RollingSuppressionForecast } from "./rolling-suppression-forecast.js";

/** One step of the rolling suppression forecast calculation. */
export interface RollingSuppressionForecastAdjuster {
  describe(): string;
  adjust(item: RollingSuppressionForecast, value: number): number;
}

export class PercentRollingSuppressionForecastAdjuster implements RollingSuppressionForecastAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingSuppressionForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRollingSuppressionForecastAdjuster implements RollingSuppressionForecastAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingSuppressionForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapRollingSuppressionForecastAdjuster implements RollingSuppressionForecastAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingSuppressionForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the rolling suppression forecast steps in order and keeps a trace of each. */
export class RollingSuppressionForecastEngine {
  steps: RollingSuppressionForecastAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingSuppressionForecastAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RollingSuppressionForecast): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: RollingSuppressionForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRollingSuppressionForecastEngine(): RollingSuppressionForecastEngine {
  return new RollingSuppressionForecastEngine(
    [
      new PercentRollingSuppressionForecastAdjuster(-16.2),
      new RoundingRollingSuppressionForecastAdjuster(1),
      new CapRollingSuppressionForecastAdjuster(36956),
    ],
    [],
    2.7,
    51946.5,
  );
}

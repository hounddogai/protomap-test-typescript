import * as flags from "../../../../kit/flags.js";
import { StepForecast } from "./step-forecast.js";

/** One step of the step forecast calculation. */
export interface StepForecastAdjuster {
  describe(): string;
  adjust(item: StepForecast, value: number): number;
}

export class PercentStepForecastAdjuster implements StepForecastAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StepForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedStepForecastAdjuster implements StepForecastAdjuster {
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

  adjust(item: StepForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumStepForecastAdjuster implements StepForecastAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StepForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the step forecast steps in order and keeps a trace of each. */
export class StepForecastEngine {
  steps: StepForecastAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StepForecastAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: StepForecast): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: StepForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultStepForecastEngine(flagsValue: flags.Registry): StepForecastEngine {
  return new StepForecastEngine(
    [
      new PercentStepForecastAdjuster(21.1),
      new FlaggedStepForecastAdjuster(flagsValue, "step-forecast-adaptive", 5.4),
      new MinimumStepForecastAdjuster(28.5),
    ],
    [],
    1.5,
    70012.2,
  );
}

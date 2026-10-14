import { PathForecast } from "./path-forecast.js";

/** One step of the path forecast calculation. */
export interface PathForecastAdjuster {
  describe(): string;
  adjust(item: PathForecast, value: number): number;
}

export class MinimumPathForecastAdjuster implements PathForecastAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PathForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentPathForecastAdjuster implements PathForecastAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PathForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class PathForecastAttemptsOffsetAdjuster implements PathForecastAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: PathForecast, value: number): number {
    return value + item.attempts * this.weight;
  }
}

/** Runs the path forecast steps in order and keeps a trace of each. */
export class PathForecastEngine {
  steps: PathForecastAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PathForecastAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PathForecast): number {
    let current = item.netValue();
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

  evaluateAll(items: PathForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPathForecastEngine(): PathForecastEngine {
  return new PathForecastEngine(
    [
      new MinimumPathForecastAdjuster(40.1),
      new PercentPathForecastAdjuster(-16.1),
      new PathForecastAttemptsOffsetAdjuster(1.85),
    ],
    [],
    0.7,
    16985,
  );
}

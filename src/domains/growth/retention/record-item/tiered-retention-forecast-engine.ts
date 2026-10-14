import { TieredRetentionForecast } from "./tiered-retention-forecast.js";

/** One step of the tiered retention forecast calculation. */
export interface TieredRetentionForecastAdjuster {
  describe(): string;
  adjust(item: TieredRetentionForecast, value: number): number;
}

export class MinimumTieredRetentionForecastAdjuster implements TieredRetentionForecastAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredRetentionForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentTieredRetentionForecastAdjuster implements TieredRetentionForecastAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredRetentionForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredRetentionForecastBudgetOffsetAdjuster implements TieredRetentionForecastAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: TieredRetentionForecast, value: number): number {
    return value + item.budget * this.weight;
  }
}

/** Runs the tiered retention forecast steps in order and keeps a trace of each. */
export class TieredRetentionForecastEngine {
  steps: TieredRetentionForecastAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredRetentionForecastAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredRetentionForecast): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: TieredRetentionForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredRetentionForecastEngine(): TieredRetentionForecastEngine {
  return new TieredRetentionForecastEngine(
    [
      new MinimumTieredRetentionForecastAdjuster(16.1),
      new PercentTieredRetentionForecastAdjuster(0.2),
      new TieredRetentionForecastBudgetOffsetAdjuster(1.46),
    ],
    [],
    3,
    41682.7,
  );
}
